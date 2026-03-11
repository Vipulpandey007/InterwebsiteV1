const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // ─── Connection Pool (key fix for concurrent load) ───────────
      maxPoolSize: 20, // Allow up to 20 simultaneous DB connections (default: 5)
      minPoolSize: 5, // Keep 5 connections warm at all times

      // ─── Timeouts ────────────────────────────────────────────────
      serverSelectionTimeoutMS: 5000, // Give up finding a server after 5s
      socketTimeoutMS: 45000, // Close idle sockets after 45s
      connectTimeoutMS: 10000, // Give up initial connection after 10s

      // ─── Reliability ─────────────────────────────────────────────
      retryWrites: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   Pool Size: max=${20}, min=${5}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

// Log connection events
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected");
});

module.exports = connectDB;
