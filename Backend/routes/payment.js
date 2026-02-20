const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentStatus,
  handleWebhook,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

/**
 * Protected Routes (Require JWT token)
 */

// @route   POST /api/payment/create-order
// @desc    Create Razorpay order for payment
// @access  Private
router.post("/create-order", protect, createOrder);

// @route   POST /api/payment/verify
// @desc    Verify Razorpay payment signature
// @access  Private
router.post("/verify", protect, verifyPayment);

// @route   GET /api/payment/status/:applicationId
// @desc    Get payment status for an application
// @access  Private
router.get("/status/:applicationId", protect, getPaymentStatus);

/**
 * Public Routes (for webhooks)
 */

// @route   POST /api/payment/webhook
// @desc    Handle Razorpay webhook events
// @access  Public (verified with webhook secret)
router.post("/webhook", handleWebhook);

module.exports = router;
