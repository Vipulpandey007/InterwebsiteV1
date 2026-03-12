const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const { generalLimiter } = require("./middleware/rateLimiter");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors());

// Static files — serve uploaded photos and documents
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));

// ── General rate limiter — 200 requests per IP per 15 min on all /api routes ──
// More specific limiters (OTP, admin login, PDF) are applied per-route in their
// respective route files and will override this for those endpoints.
app.use("/api", generalLimiter);

// Debug middleware — log all requests (remove or disable in production)
app.use((req, res, next) => {
  console.log("\n=== INCOMING REQUEST ===");
  console.log("Time:  ", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:   ", req.originalUrl);
  console.log("IP:    ", req.ip);
  console.log("Body:  ", req.body);
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/applications", require("./routes/application"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/pdf", require("./routes/pdf"));
app.use("/api/admin", require("./routes/admin"));

// Health check (not rate limited — exempt from /api limiter)
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("=== SERVER ERROR ===");
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("\n========================================");
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
  console.log("🛡️  Rate limiting: ACTIVE");
  console.log("========================================\n");
});
