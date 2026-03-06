const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║     AUTH MIDDLEWARE - PROTECT          ║");
  console.log("╚════════════════════════════════════════╝");

  let token;

  console.log("📍 URL:", req.originalUrl);
  console.log("📍 Method:", req.method);
  console.log("📍 All Headers:", JSON.stringify(req.headers, null, 2));

  // Check for authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  console.log("📍 Authorization Header:", authHeader);

  if (authHeader && authHeader.startsWith("Bearer")) {
    try {
      // Extract token
      token = authHeader.split(" ")[1];
      console.log("✅ Token extracted successfully");
      console.log("📍 Token (first 50 chars):", token.substring(0, 50) + "...");

      // Check if JWT_SECRET exists
      if (!process.env.JWT_SECRET) {
        console.error("❌ JWT_SECRET not found in environment variables!");
        return res.status(500).json({
          success: false,
          message: "Server configuration error",
        });
      }

      console.log("✅ JWT_SECRET exists");

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified successfully");
      console.log("📍 Decoded token:", JSON.stringify(decoded, null, 2));

      // Get user from database
      console.log("🔍 Finding user with ID:", decoded.id);
      const user = await User.findById(decoded.id).select("-otp -otpExpires");

      if (!user) {
        console.error("❌ User not found in database");
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      console.log("✅ User found:", user.name, "(" + user.email + ")");

      // Attach user to request
      req.user = user;

      console.log("✅ User attached to req.user");
      console.log("╔════════════════════════════════════════╗");
      console.log("║     AUTHENTICATION SUCCESSFUL          ║");
      console.log("╚════════════════════════════════════════╝\n");

      next();
    } catch (error) {
      console.error("\n╔════════════════════════════════════════╗");
      console.error("║     AUTHENTICATION FAILED              ║");
      console.error("╚════════════════════════════════════════╝");
      console.error("❌ Error Type:", error.name);
      console.error("❌ Error Message:", error.message);
      console.error("❌ Stack:", error.stack);

      let message = "Not authorized, token failed";

      if (error.name === "TokenExpiredError") {
        message = "Token expired, please login again";
      } else if (error.name === "JsonWebTokenError") {
        message = "Invalid token";
      }

      return res.status(401).json({
        success: false,
        message: message,
      });
    }
  } else {
    console.error("\n╔════════════════════════════════════════╗");
    console.error("║     NO TOKEN PROVIDED                  ║");
    console.error("╚════════════════════════════════════════╝");
    console.error("❌ Authorization header missing or invalid format");
    console.error("❌ Expected: Bearer <token>");
    console.error("❌ Received:", authHeader || "undefined");

    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }
};

module.exports = { protect };
