const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  otpRequestLimiter,
  otpVerifyLimiter,
  resendOTPLimiter,
} = require("../middleware/rateLimiter");

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
// @desc    Register new user (Step 1 — sends OTP)
// @access  Public — 5 OTP requests per IP per 15 min
router.post("/signup", otpRequestLimiter, signupController);

// @route   POST /api/auth/verify-signup
// @desc    Verify OTP and complete signup (Step 2)
// @access  Public — 10 verify attempts per IP per 15 min
router.post("/verify-signup", otpVerifyLimiter, verifySignupController);

// ==================== LOGIN ROUTES ====================

// @route   POST /api/auth/login
// @desc    Login user (Step 1 — sends OTP)
// @access  Public — 5 OTP requests per IP per 15 min
router.post("/login", otpRequestLimiter, loginController);

// @route   POST /api/auth/verify-login
// @desc    Verify OTP and login (Step 2)
// @access  Public — 10 verify attempts per IP per 15 min
router.post("/verify-login", otpVerifyLimiter, verifyLoginController);

// ==================== OTP ROUTES ====================

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public — 3 resends per IP per 15 min (stricter)
router.post("/resend-otp", resendOTPLimiter, resendOTPController);

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
