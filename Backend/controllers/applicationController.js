const Application = require("../models/Application");
const mongoose = require("mongoose");

/**
 * @desc    Create new application (save as draft or submit)
 * @route   POST /api/applications
 * @access  Private (logged-in users only)
 */
const createApplication = async (req, res) => {
  try {
    const {
      fullName,
      fatherName,
      email,
      mobile,
      address,
      course,
      twelfthMarks,
    } = req.body;

    // Check if user already has an application
    const existingApplication = await Application.findOne({
      userId: req.user.id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted an application",
        data: {
          applicationNumber: existingApplication.applicationNumber,
          status: existingApplication.status,
        },
      });
    }

    // Create new application
    const application = new Application({
      userId: req.user.id,
      fullName,
      fatherName,
      email,
      mobile,
      address,
      course,
      twelfthMarks,
      paymentStatus: "pending", // Default as required
      status: "draft", // Start as draft
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: "Application created successfully",
      data: {
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        paymentStatus: application.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Create Application Error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create application. Please try again.",
    });
  }
};

/**
 * @desc    Update application (draft mode)
 * @route   PUT /api/applications/:id
 * @access  Private
 */
const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      fatherName,
      email,
      mobile,
      address,
      course,
      twelfthMarks,
    } = req.body;

    // Find application
    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user owns this application
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this application",
      });
    }

    // Check if application is already submitted
    if (application.status === "submitted") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a submitted application",
      });
    }

    // Check if payment is completed
    if (application.paymentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot update application after payment is completed",
      });
    }

    // Update fields
    if (fullName) application.fullName = fullName;
    if (fatherName) application.fatherName = fatherName;
    if (email) application.email = email;
    if (mobile) application.mobile = mobile;
    if (address) application.address = address;
    if (course) application.course = course;
    if (twelfthMarks !== undefined) application.twelfthMarks = twelfthMarks;

    await application.save();

    res.status(200).json({
      success: true,
      message: "Application updated successfully",
      data: {
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("Update Application Error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update application",
    });
  }
};

/**
 * @desc    Get single application by ID
 * @route   GET /api/applications/:id
 * @access  Private
 */
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id).populate(
      "userId",
      "mobile name email",
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user owns this application
    if (application.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this application",
      });
    }

    res.status(200).json({
      success: true,
      data: { application },
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
 * @desc    Get all applications for logged-in user
 * @route   GET /api/applications/my-applications
 * @access  Private
 */
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: { applications },
    });
  } catch (error) {
    console.error("Get My Applications Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

/**
 * @desc    Submit application (mark as submitted)
 * @route   POST /api/applications/:id/submit
 * @access  Private
 */
const submitApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);

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
        message: "You are not authorized to submit this application",
      });
    }

    // Check if already submitted
    if (application.status === "submitted") {
      return res.status(400).json({
        success: false,
        message: "Application is already submitted",
      });
    }

    // Validate all required fields are present
    if (
      !application.fullName ||
      !application.fatherName ||
      !application.email ||
      !application.mobile ||
      !application.address ||
      !application.course ||
      application.twelfthMarks === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields before submitting",
      });
    }

    // Mark as submitted
    application.markAsSubmitted();
    await application.save();

    res.status(200).json({
      success: true,
      message: "Application submitted successfully",
      data: {
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        submittedAt: application.submittedAt,
      },
    });
  } catch (error) {
    console.error("Submit Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  }
};

/**
 * @desc    Delete application (only draft applications)
 * @route   DELETE /api/applications/:id
 * @access  Private
 */
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);

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
        message: "You are not authorized to delete this application",
      });
    }

    // Only allow deletion of draft applications
    if (application.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete submitted applications",
      });
    }

    await Application.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Delete Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
    });
  }
};

/**
 * @desc    Get application statistics for user
 * @route   GET /api/applications/stats
 * @access  Private
 */
const getApplicationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Application.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          draft: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
          submitted: {
            $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] },
          },
          paymentPending: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
          },
          paymentCompleted: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "completed"] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data:
        stats.length > 0
          ? stats[0]
          : {
              total: 0,
              draft: 0,
              submitted: 0,
              paymentPending: 0,
              paymentCompleted: 0,
            },
    });
  } catch (error) {
    console.error("Get Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

module.exports = {
  createApplication,
  updateApplication,
  getApplicationById,
  getMyApplications,
  submitApplication,
  deleteApplication,
  getApplicationStats,
};
