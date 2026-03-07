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

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find admin user
    const admin = await User.findOne({ email, role: "admin" }).select(
      "+password",
    );

    if (!admin) {
      console.log("❌ Admin not found");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      console.log("❌ Invalid password");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
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
    res.status(500).json({
      success: false,
      message: "Server error",
    });
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

    // Get counts
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

    // Get revenue (sum of all completed payments)
    const revenueData = await Application.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // Get today's applications
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
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
      data: {
        applications,
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
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        application,
      },
    });
  } catch (error) {
    console.error("Get Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
    });
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

    // Validate status
    const validStatuses = [
      "draft",
      "submitted",
      "under_review",
      "approved",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = status;
    await application.save();

    console.log("✅ Status updated successfully");

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: {
        application,
      },
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

/**
 * @desc    Create admin user (for initial setup)
 * @route   POST /api/admin/create
 * @access  Public (should be protected in production)
 */
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     CREATE ADMIN USER                  ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("Email:", email);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    // Create admin user
    const admin = await User.create({
      name,
      email,
      mobile,
      password,
      role: "admin",
      isVerified: true,
      isMobileVerified: true,
    });

    console.log("✅ Admin created successfully");

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
    console.error("Create Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create admin",
      error: error.message,
    });
  }
};

module.exports = {
  adminLogin,
  getStats,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  createAdmin,
};
