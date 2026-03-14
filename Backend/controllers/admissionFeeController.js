const crypto = require("crypto");
const Application = require("../models/Application");
const AdmissionSettings = require("../models/AdmissionSettings");
const { createRazorpayOrder } = require("../utils/razorpayUtils");

// ── Helper: resolve fee amount from settings for a given course + category ───
// Priority: exact course+category match → course-only match (any category) → 0
async function resolveFeeAmount(appliedFor, category) {
  const settings = await AdmissionSettings.getSettings();
  const fees = settings.admissionFees || [];

  // 1. Exact match: course + category
  const exact = fees.find(
    (f) => f.course === appliedFor && f.category === category,
  );
  if (exact) return exact.amount;

  // 2. Course-only match: category field is empty string (means "all categories")
  const courseOnly = fees.find(
    (f) => f.course === appliedFor && (!f.category || f.category === ""),
  );
  if (courseOnly) return courseOnly.amount;

  return 0;
}

/**
 * @desc    Create Razorpay order for admission fee
 * @route   POST /api/admission-fee/create-order
 * @access  Private (student)
 */
const createAdmissionOrder = async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res
        .status(400)
        .json({ success: false, message: "Application ID is required" });
    }

    const application = await Application.findById(applicationId);

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    // Must belong to requesting user
    if (application.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Must be approved first
    if (application.status !== "approved") {
      return res.status(403).json({
        success: false,
        code: "NOT_APPROVED",
        message:
          "Admission fee can only be paid after your application is approved.",
      });
    }

    // Prevent double payment
    if (application.admissionFeeStatus === "completed") {
      return res.status(409).json({
        success: false,
        code: "ALREADY_PAID",
        message: "Admission fee already paid.",
        data: {
          admissionTransactionId: application.admissionTransactionId,
          admissionFeeDate: application.admissionFeeDate,
        },
      });
    }

    // Resolve fee amount from settings (stamp it now so it's server-locked)
    const feeAmount = await resolveFeeAmount(
      application.appliedFor,
      application.category,
    );

    if (!feeAmount || feeAmount <= 0) {
      return res.status(400).json({
        success: false,
        code: "FEE_NOT_CONFIGURED",
        message:
          "Admission fee has not been configured for your course/category. Please contact the college office.",
      });
    }

    // Stamp the locked amount onto the application
    application.admissionFeeAmount = feeAmount;

    // Create Razorpay order
    const orderResult = await createRazorpayOrder(
      feeAmount,
      `AF-${application.applicationNumber}`,
      {
        applicationId: application._id.toString(),
        applicationNumber: application.applicationNumber,
        userId: req.user.id,
        type: "admission_fee",
      },
    );

    application.admissionRazorpayOrderId = orderResult.order.id;
    await application.save();

    console.log(
      "✅ Admission fee order created:",
      orderResult.order.id,
      "Amount:",
      feeAmount,
    );

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: orderResult.order.id,
        amount: feeAmount,
        currency: "INR",
        applicationNumber: application.applicationNumber,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        name: application.fullName,
        email: application.email,
        mobile: application.contactNo,
      },
    });
  } catch (error) {
    console.error("Create Admission Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order. Please try again.",
    });
  }
};

/**
 * @desc    Verify admission fee payment
 * @route   POST /api/admission-fee/verify
 * @access  Private (student)
 */
const verifyAdmissionPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      applicationId,
    } = req.body;

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     VERIFY ADMISSION FEE PAYMENT       ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);

    const application = await Application.findById(applicationId);

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    if (application.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Verify Razorpay signature — identical pattern to paymentController
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      console.log("✅ Admission fee signature verified");

      application.admissionFeeStatus = "completed";
      application.admissionRazorpayPaymentId = razorpay_payment_id;
      application.admissionRazorpaySignature = razorpay_signature;
      application.admissionTransactionId = razorpay_payment_id;
      application.admissionFeeDate = new Date();
      application.admissionFeeReceiptGenerated = false; // generated on-demand like admit card

      // Activity log
      application.activityLog.push({
        action: "admission_fee_paid",
        by: req.user.email || "student",
        fromValue: "pending",
        toValue: "completed",
        note: `Admission fee of ₹${application.admissionFeeAmount} paid online. Txn: ${razorpay_payment_id}`,
        at: new Date(),
      });

      await application.save();
      console.log("✅ Admission fee payment recorded");

      res.status(200).json({
        success: true,
        message: "Admission fee payment verified successfully",
        data: { application },
      });
    } else {
      console.error("❌ Invalid admission fee signature");
      application.admissionFeeStatus = "failed";
      await application.save();

      res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }
  } catch (error) {
    console.error("Verify Admission Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

/**
 * @desc    Admin marks admission fee as paid offline (cash / DD)
 * @route   POST /api/admission-fee/:id/mark-offline
 * @access  Private (admin only)
 */
const markOfflinePaid = async (req, res) => {
  try {
    const { note } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    if (application.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Application must be approved before marking fee as paid.",
      });
    }

    if (application.admissionFeeStatus === "completed") {
      return res.status(409).json({
        success: false,
        message: "Admission fee already marked as paid.",
      });
    }

    // Resolve fee amount if not already stamped
    if (
      !application.admissionFeeAmount ||
      application.admissionFeeAmount === 0
    ) {
      const feeAmount = await resolveFeeAmount(
        application.appliedFor,
        application.category,
      );
      application.admissionFeeAmount = feeAmount;
    }

    application.admissionFeeStatus = "completed";
    application.admissionFeeDate = new Date();
    application.markedPaidOffline = true;
    application.markedPaidBy = req.user.email;
    application.markedPaidNote =
      note || "Marked as paid by admin (offline/cash)";
    // No Razorpay IDs for offline payments

    // Activity log
    application.activityLog.push({
      action: "admission_fee_marked_offline",
      by: req.user.email,
      fromValue: "pending",
      toValue: "completed",
      note: `Admission fee of ₹${application.admissionFeeAmount} marked as paid offline by ${req.user.email}. ${note || ""}`,
      at: new Date(),
    });

    await application.save();

    console.log(
      "✅ Admission fee marked offline for:",
      application.applicationNumber,
      "by:",
      req.user.email,
    );

    res.status(200).json({
      success: true,
      message: "Admission fee marked as paid (offline)",
      data: { application },
    });
  } catch (error) {
    console.error("Mark Offline Paid Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark as paid",
    });
  }
};

/**
 * @desc    Get fee management stats for admin panel
 * @route   GET /api/admission-fee/stats
 * @access  Private (admin only)
 */
const getFeeStats = async (req, res) => {
  try {
    // Only approved applications are eligible for admission fee
    const totalApproved = await Application.countDocuments({
      status: "approved",
    });
    const totalPaid = await Application.countDocuments({
      status: "approved",
      admissionFeeStatus: "completed",
    });
    const totalPending = await Application.countDocuments({
      status: "approved",
      admissionFeeStatus: "pending",
    });
    const totalOffline = await Application.countDocuments({
      status: "approved",
      admissionFeeStatus: "completed",
      markedPaidOffline: true,
    });

    // Total collection
    const collectionData = await Application.aggregate([
      {
        $match: {
          status: "approved",
          admissionFeeStatus: "completed",
        },
      },
      { $group: { _id: null, total: { $sum: "$admissionFeeAmount" } } },
    ]);
    const totalCollection =
      collectionData.length > 0 ? collectionData[0].total : 0;

    // Breakdown by course
    const courseBreakdown = await Application.aggregate([
      { $match: { status: "approved", admissionFeeStatus: "completed" } },
      {
        $group: {
          _id: "$appliedFor",
          count: { $sum: 1 },
          amount: { $sum: "$admissionFeeAmount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalApproved,
        totalPaid,
        totalPending,
        totalOffline,
        totalCollection,
        courseBreakdown,
      },
    });
  } catch (error) {
    console.error("Get Fee Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

/**
 * @desc    Get paginated list of approved applications with fee status
 * @route   GET /api/admission-fee/list
 * @access  Private (admin only)
 */
const getFeeList = async (req, res) => {
  try {
    const { page = 1, limit = 20, feeStatus, course, search } = req.query;

    const query = { status: "approved" };

    if (feeStatus && feeStatus !== "all") {
      if (feeStatus === "offline") {
        query.admissionFeeStatus = "completed";
        query.markedPaidOffline = true;
      } else {
        query.admissionFeeStatus = feeStatus;
      }
    }

    if (course && course !== "all") {
      query.appliedFor = course;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, applications] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .select(
          "applicationNumber fullName appliedFor category admissionFeeAmount admissionFeeStatus admissionFeeDate admissionTransactionId markedPaidOffline markedPaidBy markedPaidNote status",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum),
      data: { applications },
    });
  } catch (error) {
    console.error("Get Fee List Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch fee list" });
  }
};

module.exports = {
  createAdmissionOrder,
  verifyAdmissionPayment,
  markOfflinePaid,
  getFeeStats,
  getFeeList,
};
