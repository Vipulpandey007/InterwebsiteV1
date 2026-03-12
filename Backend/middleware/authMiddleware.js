const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
  let token;

  console.log("\n🔒 Auth Middleware - Checking authorization...");
  console.log(
    "Headers:",
    req.headers.authorization
      ? "Authorization header present"
      : "No authorization header",
  );

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    console.log("✅ Token found in Bearer header");
  }

  // Fallback: token in query string (?token=...) — used by window.open PDF downloads
  if (!token && req.query.token) {
    token = req.query.token;
    console.log("✅ Token found in query string");
  }

  // Check if token exists
  if (!token) {
    console.error("❌ No token found - Unauthorized");
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified - User ID:", decoded.id);

    // Get user from token
    req.user = await User.findById(decoded.id).select(
      "-password -otp -otpExpires",
    );

    if (!req.user) {
      console.error("❌ User not found");
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      "✅ User authenticated:",
      req.user.email,
      "Role:",
      req.user.role,
    );
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

/**
 * Admin only middleware - Check if user is admin
 */
const adminOnly = async (req, res, next) => {
  console.log("\n👮 Admin Check - Verifying admin role...");
  console.log("User role:", req.user?.role);

  if (req.user && req.user.role === "admin") {
    console.log("✅ Admin access granted");
    next();
  } else {
    console.error("❌ Access denied - Not an admin");
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
};

module.exports = { protect, adminOnly };
