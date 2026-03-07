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
 * @desc    Verify payment
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

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     VERIFY PAYMENT                     ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);
    console.log("Application ID:", applicationId);

    // Get application
    const application = await Application.findById(applicationId);

    if (!application) {
      console.error("❌ Application not found");
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if application belongs to user
    if (application.userId.toString() !== req.user.id) {
      console.error("❌ Unauthorized access");
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    console.log("Expected signature:", expectedSign);
    console.log("Received signature:", razorpay_signature);

    if (razorpay_signature === expectedSign) {
      console.log("✅ Signature verified successfully");

      // Update application payment details
      application.paymentStatus = "completed";
      application.razorpayPaymentId = razorpay_payment_id;
      application.razorpaySignature = razorpay_signature;
      application.transactionId = razorpay_payment_id;
      application.paymentDate = new Date();

      await application.save();

      console.log("✅ Application payment updated successfully");

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: {
          application,
        },
      });
    } else {
      console.error("❌ Invalid signature");

      // Update payment status to failed
      application.paymentStatus = "failed";
      await application.save();

      res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }
  } catch (error) {
    console.error("Verify Payment Error:", error);
    console.error("Error message:", error.message);
    console.error("Stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
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
    const signature = req.headers["x-razorpay-signature"];

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
