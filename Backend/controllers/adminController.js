const AdmissionSettings = require("../models/AdmissionSettings");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

/**
 * @desc    Admin login
 * @route   POST /api/admin/login
 * @access  Public
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     ADMIN LOGIN                        ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("Email:", email);

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    const admin = await User.findOne({ email, role: "admin" }).select(
      "+password",
    );

    if (!admin) {
      console.log("❌ Admin not found");
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      console.log("❌ Invalid password");
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "30d" },
    );

    console.log("✅ Admin login successful");

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
const getStats = async (req, res) => {
  try {
    const Application = require("../models/Application");

    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({
      status: { $in: ["submitted", "under_review"] },
    });
    const approvedApplications = await Application.countDocuments({
      status: "approved",
    });
    const rejectedApplications = await Application.countDocuments({
      status: "rejected",
    });

    const revenueData = await Application.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayApplications = await Application.countDocuments({
      createdAt: { $gte: today },
    });

    res.status(200).json({
      success: true,
      data: {
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalRevenue,
        todayApplications,
      },
    });
  } catch (error) {
    console.error("Get Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

/**
 * @desc    Get all applications
 * @route   GET /api/admin/applications
 * @access  Private (Admin only)
 */
const getAllApplications = async (req, res) => {
  try {
    const Application = require("../models/Application");

    const applications = await Application.find()
      .populate("userId", "name email mobile")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: { applications },
    });
  } catch (error) {
    console.error("Get All Applications Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch applications" });
  }
};

/**
 * @desc    Get application by ID
 * @route   GET /api/admin/applications/:id
 * @access  Private (Admin only)
 */
const getApplicationById = async (req, res) => {
  try {
    const Application = require("../models/Application");

    const application = await Application.findById(req.params.id).populate(
      "userId",
      "name email mobile",
    );

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    res.status(200).json({ success: true, data: { application } });
  } catch (error) {
    console.error("Get Application Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch application" });
  }
};

/**
 * @desc    Update application status
 * @route   PUT /api/admin/applications/:id/status
 * @access  Private (Admin only)
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const Application = require("../models/Application");
    const { status } = req.body;

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     UPDATE APPLICATION STATUS          ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("Application ID:", req.params.id);
    console.log("New Status:", status);

    const validStatuses = [
      "draft",
      "submitted",
      "under_review",
      "approved",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    application.status = status;
    await application.save();

    console.log("✅ Status updated successfully");

    res
      .status(200)
      .json({
        success: true,
        message: "Status updated successfully",
        data: { application },
      });
  } catch (error) {
    console.error("Update Status Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update status" });
  }
};

/**
 * @desc    Update entire application details (NEW FUNCTION ADDED HERE)
 * @route   PUT /api/admin/applications/:id
 * @access  Private (Admin only)
 */
const updateApplication = async (req, res) => {
  try {
    const Application = require("../models/Application");
    const { id } = req.params;
    const updateData = req.body;

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     UPDATE APPLICATION (FULL)          ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("Application ID:", id);

    // Prevent overriding critical underlying IDs
    delete updateData._id;
    delete updateData.userId;
    delete updateData.applicationNumber;

    const application = await Application.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("userId", "name email mobile");

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    console.log("✅ Application updated successfully");

    res
      .status(200)
      .json({
        success: true,
        message: "Application updated successfully",
        data: { application },
      });
  } catch (error) {
    console.error("Update Application Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update application",
        error: error.message,
      });
  }
};

/**
 * @desc    Create admin user
 * @route   POST /api/admin/create
 * @access  Public
 */
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Admin with this email already exists",
        });
    }

    const admin = await User.create({
      name,
      email,
      mobile,
      password,
      role: "admin",
      isVerified: true,
      isMobileVerified: true,
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create admin",
        error: error.message,
      });
  }
};

/**
 * @desc    Get admission portal settings
 */
const getSettings = async (req, res) => {
  try {
    const settings = await AdmissionSettings.getSettings();
    res.status(200).json({
      success: true,
      data: {
        session: settings.session,
        isOpen: settings.isOpen,
        openDate: settings.openDate,
        closeDate: settings.closeDate,
        closedMessage: settings.closedMessage,
        isAccepting: settings.isAccepting,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch settings" });
  }
};

/**
 * @desc    Update admission portal settings
 */
const updateSettings = async (req, res) => {
  try {
    const { session, isOpen, openDate, closeDate, closedMessage } = req.body;
    const settings = await AdmissionSettings.getSettings();

    if (session !== undefined) settings.session = session;
    if (isOpen !== undefined) settings.isOpen = isOpen;
    if (openDate !== undefined)
      settings.openDate = openDate ? new Date(openDate) : null;
    if (closeDate !== undefined)
      settings.closeDate = closeDate ? new Date(closeDate) : null;
    if (closedMessage !== undefined) settings.closedMessage = closedMessage;

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: {
        session: settings.session,
        isOpen: settings.isOpen,
        openDate: settings.openDate,
        closeDate: settings.closeDate,
        closedMessage: settings.closedMessage,
        isAccepting: settings.isAccepting,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update settings" });
  }
};

// ADDED updateApplication to the exports below!
module.exports = {
  adminLogin,
  getStats,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  updateApplication,
  createAdmin,
  getSettings,
  updateSettings,
};
