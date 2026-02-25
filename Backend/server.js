const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Raw body parser for Razorpay webhook (must be before express.json)
// Razorpay signature verification requires the raw, unparsed body
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Logger middleware (only in development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Static files (for uploaded documents and generated PDFs)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/applications", require("./routes/application"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/pdf", require("./routes/pdf"));
app.use("/api/admin", require("./routes/admin"));

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "College Admission Backend API",
    version: "1.0.0",
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});
