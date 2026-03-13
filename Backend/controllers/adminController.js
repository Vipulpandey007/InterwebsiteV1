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
 * @desc    Get all applications (with pagination, search, and filtering)
 * @route   GET /api/admin/applications
 * @access  Private (Admin only)
 */
const getAllApplications = async (req, res) => {
  try {
    const Application = require("../models/Application");

    // 1. Get params from the frontend request URL
    const { page = 1, limit = 20, status, search } = req.query;

    // 2. Build the query object
    const query = {};

    // Apply Status Filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Apply Search Filter (Optimized MongoDB Text Search)
    if (search) {
      // By default, $text search is case-insensitive
      // Enclosing in quotes ensures it searches for the exact phrase/number typed
      query.$text = { $search: search };
    }

    // 3. Pagination Math
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // 4. Execute Queries in parallel
    const [total, applications] = await Promise.all([
      Application.countDocuments(query), // Gets total matching documents
      Application.find(query) // Gets the actual documents for this page
        .populate("userId", "name email mobile")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // 5. Return data exactly as frontend expects it
    res.status(200).json({
      success: true,
      total, // Frontend needs this
      totalPages, // Frontend needs this
      data: {
        applications, // Frontend maps over this
      },
    });
  } catch (error) {
    console.error("Get All Applications Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
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

    const previousStatus = application.status;
    application.status = status;

    // Log the status change
    application.activityLog.push({
      action: "status_changed",
      by: req.user.email,
      fromValue: previousStatus,
      toValue: status,
      note: `Status changed from "${previousStatus}" to "${status}"`,
      at: new Date(),
    });

    await application.save();

    console.log("✅ Status updated successfully");

    res.status(200).json({
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
 * @desc    Update entire application details
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

    // Prevent overriding critical underlying IDs and timestamps
    delete updateData._id;
    delete updateData.userId;
    delete updateData.applicationNumber;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const application = await Application.findById(id);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    // Smarter comparison to find actually changed fields
    const changedFields = Object.keys(updateData)
      .filter((k) => !["activityLog", "__v"].includes(k))
      .filter((k) => {
        const oldVal = application[k];
        const newVal = updateData[k];

        // 1. Normalize empty values (treat undefined, null, and "" as exactly the same)
        const normOld = [undefined, null, ""].includes(oldVal) ? "" : oldVal;
        const normNew = [undefined, null, ""].includes(newVal) ? "" : newVal;

        // If both are empty after normalization, it hasn't changed
        if (normOld === "" && normNew === "") return false;

        // 2. Handle Date comparisons safely
        if (oldVal instanceof Date && newVal) {
          try {
            return oldVal.toISOString() !== new Date(newVal).toISOString();
          } catch (e) {
            return true; // If parsing fails, flag it as changed just in case
          }
        }

        // 3. Standard string comparison for everything else
        return String(normOld) !== String(normNew);
      });

    Object.assign(application, updateData);

    // Only log the edit if something ACTUALLY changed
    if (changedFields.length > 0) {
      application.activityLog.push({
        action: "fields_edited",
        by: req.user.email,
        fromValue: null,
        toValue: null,
        note: `Edited fields: ${changedFields.join(", ")}`,
        at: new Date(),
      });
    }

    await application.save();
    await application.populate("userId", "name email mobile");

    console.log(
      `✅ Application updated. Changed fields: ${changedFields.length}`,
    );

    res.status(200).json({
      success: true,
      message: "Application updated successfully",
      data: { application },
    });
  } catch (error) {
    console.error("Update Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update application",
      error: error.message,
    });
  }
};

/**
 * @desc    Get activity log for an application
 * @route   GET /api/admin/applications/:id/activity
 * @access  Private (Admin only)
 */
const getActivityLog = async (req, res) => {
  try {
    const Application = require("../models/Application");
    const application = await Application.findById(req.params.id).select(
      "activityLog applicationNumber fullName",
    );

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    // Return log newest-first
    const log = [...application.activityLog].reverse();

    res.status(200).json({
      success: true,
      data: {
        applicationNumber: application.applicationNumber,
        fullName: application.fullName,
        log,
      },
    });
  } catch (error) {
    console.error("Get Activity Log Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch activity log" });
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
      return res.status(400).json({
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
    res.status(500).json({
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

module.exports = {
  adminLogin,
  getStats,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  updateApplication,
  getActivityLog,
  createAdmin,
  getSettings,
  updateSettings,
};