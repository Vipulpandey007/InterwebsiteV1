const Razorpay = require("razorpay");
const crypto = require("crypto");

/**
 * Initialize Razorpay instance
 */
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay order
 * @param {Number} amount - Amount in rupees (will be converted to paise)
 * @param {String} receipt - Unique receipt ID (application number)
 * @param {Object} notes - Additional information
 * @returns {Promise<Object>} Razorpay order object
 */
const createRazorpayOrder = async (amount, receipt, notes = {}) => {
  try {
    // Convert amount to paise (Razorpay accepts amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receipt,
      notes: notes,
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpayInstance.orders.create(options);
    return {
      success: true,
      order: order,
    };
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    throw new Error("Failed to create Razorpay order");
  }
};

/**
 * Verify Razorpay payment signature
 * @param {String} orderId - Razorpay order ID
 * @param {String} paymentId - Razorpay payment ID
 * @param {String} signature - Razorpay signature
 * @returns {Boolean} True if signature is valid
 */
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    // Create expected signature
    const text = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    // Compare signatures
    return expectedSignature === signature;
  } catch (error) {
    console.error("Signature Verification Error:", error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {String} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
const fetchPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return {
      success: true,
      payment: payment,
    };
  } catch (error) {
    console.error("Fetch Payment Error:", error);
    throw new Error("Failed to fetch payment details");
  }
};

/**
 * Refund payment
 * @param {String} paymentId - Razorpay payment ID
 * @param {Number} amount - Amount to refund (optional, full refund if not specified)
 * @returns {Promise<Object>} Refund details
 */
const refundPayment = async (paymentId, amount = null) => {
  try {
    const options = amount ? { amount: Math.round(amount * 100) } : {};
    const refund = await razorpayInstance.payments.refund(paymentId, options);

    return {
      success: true,
      refund: refund,
    };
  } catch (error) {
    console.error("Refund Error:", error);
    throw new Error("Failed to process refund");
  }
};

/**
 * Fetch order details from Razorpay
 * @param {String} orderId - Razorpay order ID
 * @returns {Promise<Object>} Order details
 */
const fetchOrderDetails = async (orderId) => {
  try {
    const order = await razorpayInstance.orders.fetch(orderId);
    return {
      success: true,
      order: order,
    };
  } catch (error) {
    console.error("Fetch Order Error:", error);
    throw new Error("Failed to fetch order details");
  }
};

module.exports = {
  razorpayInstance,
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchPaymentDetails,
  refundPayment,
  fetchOrderDetails,
};
