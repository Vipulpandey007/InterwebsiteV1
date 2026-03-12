const Application = require("../models/Application");

/**
 * @desc    Create new application with file uploads
 * @route   POST /api/applications
 * @access  Private
 */
const createApplication = async (req, res) => {
  try {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     CREATE APPLICATION                 ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("User ID:", req.user.id);
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    // Check if user already has an application
    const existingApplication = await Application.findOne({
      userId: req.user.id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted an application",
      });
    }

    // Generate unique application number
    const applicationNumber = `APP${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Prepare documents object from uploaded files
    const documents = {};
    if (req.files) {
      if (req.files.studentPhoto && req.files.studentPhoto[0]) {
        documents.studentPhoto = req.files.studentPhoto[0].filename;
      }
      if (req.files.tenthMarksheet && req.files.tenthMarksheet[0]) {
        documents.tenthMarksheet = req.files.tenthMarksheet[0].filename;
      }
      if (req.files.tenthAdmitCard && req.files.tenthAdmitCard[0]) {
        documents.tenthAdmitCard = req.files.tenthAdmitCard[0].filename;
      }
      if (req.files.transferCertificate && req.files.transferCertificate[0]) {
        documents.transferCertificate =
          req.files.transferCertificate[0].filename;
      }
      if (req.files.characterCertificate && req.files.characterCertificate[0]) {
        documents.characterCertificate =
          req.files.characterCertificate[0].filename;
      }
      if (req.files.migration && req.files.migration[0]) {
        documents.migration = req.files.migration[0].filename;
      }
      if (req.files.casteCertificate && req.files.casteCertificate[0]) {
        documents.casteCertificate = req.files.casteCertificate[0].filename;
      }
      if (req.files.bplCertificate && req.files.bplCertificate[0]) {
        documents.bplCertificate = req.files.bplCertificate[0].filename;
      }
      if (req.files.aadharCardDoc && req.files.aadharCardDoc[0]) {
        documents.aadharCardDoc = req.files.aadharCardDoc[0].filename;
      }
    }

    console.log("Documents:", documents);

    // Create application
    const application = await Application.create({
      userId: req.user.id,
      applicationNumber,
      ...req.body,
      documents,
      status: "draft",
      amount: 1000,
      paymentStatus: "pending",
    });

    console.log("✅ Application created:", application._id);

    res.status(201).json({
      success: true,
      message: "Application created successfully",
      data: {
        application,
      },
    });
  } catch (error) {
    console.error("Create Application Error:", error);
    console.error("Error details:", error.message);
    console.error("Stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Failed to create application",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};

/**
 * @desc    Get logged in user's applications
 * @route   GET /api/applications/my-applications
 * @access  Private
 */
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: {
        applications,
      },
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
 * @desc    Get application by ID
 * @route   GET /api/applications/:id
 * @access  Private
 */
const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if application belongs to user
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this application",
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
 * @desc    Update application
 * @route   PUT /api/applications/:id
 * @access  Private
 */
const updateApplication = async (req, res) => {
  try {
    let application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if application belongs to user
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this application",
      });
    }

    // Block edits once payment is completed or admin has acted
    if (application.paymentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit application after payment is completed.",
      });
    }
    if (["approved", "rejected"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit application after it has been reviewed.",
      });
    }

    // Build $set object — never mix parent key "documents" with dot-notation
    // "documents.fieldName" in the same update or MongoDB throws a conflict error.
    const setFields = { ...req.body };

    // Remove the top-level "documents" key if FormData accidentally sent it
    delete setFields.documents;

    // Merge uploaded files using dot-notation only
    if (req.files && Object.keys(req.files).length > 0) {
      Object.keys(req.files).forEach((fieldName) => {
        setFields[`documents.${fieldName}`] = req.files[fieldName][0].filename;
      });
    }

    application = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: setFields },
      { new: true, runValidators: true },
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
    });
  }
};

/**
 * @desc    Submit application
 * @route   POST /api/applications/:id/submit
 * @access  Private
 */
const submitApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if application belongs to user
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to submit this application",
      });
    }

    // Block re-submission only if payment done or admin has acted
    if (application.paymentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Application already paid — cannot resubmit.",
      });
    }
    if (["approved", "rejected"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: "Application has already been reviewed.",
      });
    }

    application.status = "submitted";
    await application.save();

    res.status(200).json({
      success: true,
      message: "Application submitted successfully",
      data: {
        application,
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
 * @desc    Delete application
 * @route   DELETE /api/applications/:id
 * @access  Private
 */
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if application belongs to user
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this application",
      });
    }

    // Don't allow deletion if payment completed
    if (application.paymentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete application after payment",
      });
    }

    await application.deleteOne();

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

module.exports = {
  createApplication,
  getMyApplications,
  getApplicationById,
  updateApplication,
  submitApplication,
  deleteApplication,
};
