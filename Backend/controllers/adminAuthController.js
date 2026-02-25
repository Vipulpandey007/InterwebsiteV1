const Admin = require("../models/Admin");
const { generateToken } = require("../utils/jwtUtils");

/**
 * @desc    Admin login with email and password
 * @route   POST /api/admin/auth/login
 * @access  Public
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find admin with password field
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact super admin.",
      });
    }

    // Verify password
    const isPasswordMatch = await admin.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = generateToken(admin._id, admin.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          role: admin.role,
          permissions: admin.getPermissions(),
          lastLogin: admin.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

/**
 * @desc    Get current admin profile
 * @route   GET /api/admin/auth/me
 * @access  Private (Admin)
 */
const getAdminProfile = async (req, res) => {
  try {
    // req.admin is set by adminProtect middleware
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          role: admin.role,
          permissions: admin.getPermissions(),
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get Admin Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

/**
 * @desc    Update admin profile
 * @route   PUT /api/admin/auth/profile
 * @access  Private (Admin)
 */
const updateAdminProfile = async (req, res) => {
  try {
    const { name, mobile } = req.body;

    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Update fields
    if (name) admin.name = name;
    if (mobile) admin.mobile = mobile;

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error("Update Admin Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

/**
 * @desc    Change admin password
 * @route   PUT /api/admin/auth/change-password
 * @access  Private (Admin)
 */
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin.id).select("+password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

/**
 * @desc    Admin logout
 * @route   POST /api/admin/auth/logout
 * @access  Private (Admin)
 */
const adminLogout = async (req, res) => {
  // Since we're using JWT, logout is handled client-side
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

module.exports = {
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  adminLogout,
};
