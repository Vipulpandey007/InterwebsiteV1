const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Import ALL controllers
const {
  signupController,
  verifySignupController,
  loginController,
  verifyLoginController,
  resendOTPController,
  getMeController,
  logoutController,
} = require("../controllers/authController");

// ==================== SIGNUP ROUTES ====================

// @route   POST /api/auth/signup
// @desc    Register new user (Step 1)
// @access  Public
router.post("/signup", signupController);

// @route   POST /api/auth/verify-signup
// @desc    Verify OTP and complete signup (Step 2)
// @access  Public
router.post("/verify-signup", verifySignupController);

// ==================== LOGIN ROUTES ====================

// @route   POST /api/auth/login
// @desc    Login user (Step 1: Send OTP)
// @access  Public
router.post("/login", loginController);

// @route   POST /api/auth/verify-login
// @desc    Verify OTP and login (Step 2)
// @access  Public
router.post("/verify-login", verifyLoginController);

// ==================== OTP ROUTES ====================

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post("/resend-otp", resendOTPController);

// ==================== USER ROUTES ====================

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", protect, getMeController);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", protect, logoutController);

module.exports = router;
