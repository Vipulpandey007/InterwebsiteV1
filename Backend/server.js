const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

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

// Debug middleware - Log all requests
app.use((req, res, next) => {
  console.log("\n=== INCOMING REQUEST ===");
  console.log("Time:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/applications", require("./routes/application"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/pdf", require("./routes/pdf"));

// Health check
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
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log("========================================\n");
});
