const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

/**
 * Protect routes - Verify JWT token
 * Add this middleware to any route that requires authentication
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (format: "Bearer <token>")
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude sensitive fields)
      req.user = await User.findById(decoded.id).select("-otp -otpExpiry");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account has been deactivated",
        });
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

/**
 * Admin protect - Verify admin token
 * Use this for admin-only routes
 */
const adminProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get admin from token
      req.admin = await Admin.findById(decoded.id).select("-password");

      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Check if admin is active
      if (!req.admin.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your admin account has been deactivated",
        });
      }

      next();
    } catch (error) {
      console.error("Admin Auth Error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized as admin",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

/**
 * Check if user has specific role
 * Usage: authorize('admin', 'super_admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check in req.user first (for regular users)
    if (req.user && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    // Check in req.admin (for admin users)
    if (req.admin && !roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Admin role '${req.admin.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

/**
 * Check if admin has specific permission
 * Usage: checkPermission('manage_users')
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    const permissions = req.admin.getPermissions();

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${permission.replace("_", " ")}`,
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work differently for authenticated vs unauthenticated users
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-otp -otpExpiry");
    } catch (error) {
      // Token is invalid but we don't fail, just continue without user
      console.log("Optional auth - invalid token");
    }
  }

  next();
};

module.exports = {
  protect,
  adminProtect,
  authorize,
  checkPermission,
  optionalAuth,
};
