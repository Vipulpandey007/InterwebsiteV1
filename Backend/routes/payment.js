const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createOrder,
  verifyPayment,
  getPaymentStatus,
} = require("../controllers/paymentController");

// Debug: Check if all functions are imported correctly
console.log("Payment Routes - Checking imports:");
console.log("createOrder:", typeof createOrder);
console.log("verifyPayment:", typeof verifyPayment);
console.log("getPaymentStatus:", typeof getPaymentStatus);
console.log("protect:", typeof protect);

// Verify all are functions
if (typeof createOrder !== "function") {
  throw new Error(
    "createOrder is not a function! Check paymentController exports.",
  );
}
if (typeof verifyPayment !== "function") {
  throw new Error(
    "verifyPayment is not a function! Check paymentController exports.",
  );
}
if (typeof getPaymentStatus !== "function") {
  throw new Error(
    "getPaymentStatus is not a function! Check paymentController exports.",
  );
}
if (typeof protect !== "function") {
  throw new Error("protect is not a function! Check authMiddleware exports.");
}

// @route   POST /api/payment/create-order
// @desc    Create Razorpay order
// @access  Private
router.post("/create-order", protect, createOrder);

// @route   POST /api/payment/verify
// @desc    Verify payment signature
// @access  Private
router.post("/verify", protect, verifyPayment);

// @route   GET /api/payment/status/:applicationId
// @desc    Get payment status
// @access  Private
router.get("/status/:applicationId", protect, getPaymentStatus);

console.log("✅ Payment routes loaded successfully");

module.exports = router;
