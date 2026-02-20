const express = require("express");
const router = express.Router();
const {
  sendOTPController,
  verifyOTPController,
  resendOTPController,
  getCurrentUser,
  updateProfile,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateSendOTP,
  validateVerifyOTP,
  validateProfileUpdate,
} = require("../middleware/validationMiddleware");

/**
 * Public Routes (No authentication required)
 */

// @route   POST /api/auth/send-otp
// @desc    Send OTP to mobile number
// @access  Public
router.post("/send-otp", validateSendOTP, sendOTPController);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login
// @access  Public
router.post("/verify-otp", validateVerifyOTP, verifyOTPController);

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post("/resend-otp", validateSendOTP, resendOTPController);

/**
 * Protected Routes (Authentication required)
 */

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
router.get("/me", protect, getCurrentUser);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", protect, validateProfileUpdate, updateProfile);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", protect, logout);

module.exports = router;
