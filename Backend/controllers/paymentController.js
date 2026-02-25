const Application = require("../models/Application");
const crypto = require("crypto");
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchPaymentDetails,
} = require("../utils/razorpayUtils");

/**
 * @desc    Create Razorpay order for application payment
 * @route   POST /api/payment/create-order
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const { applicationId } = req.body;

    // Validate applicationId
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    // Find application
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check ownership
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to make payment for this application",
      });
    }

    // Check if application is submitted
    if (application.status !== "submitted") {
      return res.status(400).json({
        success: false,
        message: "Please submit your application before making payment",
      });
    }

    // Check if payment is already completed
    if (application.paymentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed for this application",
        data: {
          transactionId: application.transactionId,
          paymentDate: application.paymentDate,
        },
      });
    }

    // Get amount (default from env or application)
    const amount =
      application.amount || parseInt(process.env.APPLICATION_FEE) || 1000;

    // Create Razorpay order
    const orderResult = await createRazorpayOrder(
      amount,
      application.applicationNumber,
      {
        applicationId: application._id.toString(),
        applicationNumber: application.applicationNumber,
        userId: req.user.id,
        userMobile: application.mobile,
        userEmail: application.email,
      },
    );

    // Save order ID in application
    application.razorpayOrderId = orderResult.order.id;
    application.amount = amount;
    await application.save();

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: orderResult.order.id,
        amount: amount,
        currency: "INR",
        applicationNumber: application.applicationNumber,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        // Additional info for frontend
        name: application.fullName,
        email: application.email,
        mobile: application.mobile,
      },
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order. Please try again.",
    });
  }
};

/**
 * @desc    Verify Razorpay payment
 * @route   POST /api/payment/verify
 * @access  Private
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      applicationId,
    } = req.body;

    // Validate required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !applicationId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification parameters",
      });
    }

    // Find application
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check ownership
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to verify payment for this application",
      });
    }

    // Verify order ID matches
    if (application.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID mismatch",
      });
    }

    // Check if payment is already verified
    if (application.paymentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment already verified for this application",
      });
    }

    // Verify signature
    const isValidSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    if (!isValidSignature) {
      // Mark payment as failed
      application.paymentStatus = "failed";
      await application.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // Fetch payment details from Razorpay for additional verification
    let paymentDetails;
    try {
      const result = await fetchPaymentDetails(razorpay_payment_id);
      paymentDetails = result.payment;
    } catch (error) {
      console.error("Error fetching payment details:", error);
    }

    // Update application with payment details
    application.updatePayment({
      transactionId: razorpay_payment_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
    });

    await application.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        transactionId: razorpay_payment_id,
        paymentStatus: application.paymentStatus,
        paymentDate: application.paymentDate,
        amount: application.amount,
      },
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment. Please contact support.",
    });
  }
};

/**
 * @desc    Get payment status for an application
 * @route   GET /api/payment/status/:applicationId
 * @access  Private
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check ownership
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this payment status",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        paymentStatus: application.paymentStatus,
        amount: application.amount,
        transactionId: application.transactionId,
        razorpayOrderId: application.razorpayOrderId,
        paymentDate: application.paymentDate,
      },
    });
  } catch (error) {
    console.error("Get Payment Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment status",
    });
  }
};

/**
 * @desc    Webhook handler for Razorpay events
 * @route   POST /api/payment/webhook
 * @access  Public (but verified with webhook secret)
 */
const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Guard: webhook secret must be configured
    if (!webhookSecret) {
      console.error("Webhook Error: RAZORPAY_WEBHOOK_SECRET is not configured");
      return res.status(500).json({
        success: false,
        message: "Webhook not configured on server",
      });
    }

    const signature = req.headers["x-razorpay-signature"];

    // Guard: signature header must be present
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing webhook signature header",
      });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle different events
    switch (event) {
      case "payment.captured":
        // Payment successful
        console.log("Payment captured:", payload.payment.entity.id);
        break;

      case "payment.failed":
        // Payment failed
        console.log("Payment failed:", payload.payment.entity.id);
        // Update application status
        const orderId = payload.payment.entity.order_id;
        const application = await Application.findOne({
          razorpayOrderId: orderId,
        });
        if (application) {
          application.paymentStatus = "failed";
          await application.save();
        }
        break;

      default:
        console.log("Unhandled webhook event:", event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentStatus,
  handleWebhook,
};
