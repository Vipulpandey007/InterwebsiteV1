const Application = require("../models/Application");
const {
  generateAdmitCardPDF,
  checkExistingPDF,
  deleteOldPDFs,
} = require("../utils/pdfGenerator");
const path = require("path");
const fs = require("fs");

/**
 * @desc    Generate admit card PDF
 * @route   POST /api/pdf/generate/:applicationId
 * @access  Private
 */
const generateAdmitCard = async (req, res) => {
  try {
    const { applicationId } = req.params;

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
          "You are not authorized to generate admit card for this application",
      });
    }

    // Check if application is submitted
    if (application.status !== "submitted") {
      return res.status(400).json({
        success: false,
        message: "Application must be submitted before generating admit card",
      });
    }

    // CRITICAL: Check if payment is completed
    if (application.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment must be completed before generating admit card",
        data: {
          paymentStatus: application.paymentStatus,
          amount: application.amount,
        },
      });
    }

    // Check if PDF already exists
    const existingPDF = checkExistingPDF(application.applicationNumber);

    if (existingPDF && application.admitCardGenerated) {
      return res.status(200).json({
        success: true,
        message: "Admit card already generated",
        data: {
          applicationNumber: application.applicationNumber,
          pdfPath: `/api/pdf/download/${applicationId}`,
          generatedAt: application.updatedAt,
        },
      });
    }

    // Delete old PDFs if any
    deleteOldPDFs(application.applicationNumber);

    // Generate new PDF
    const pdfPath = await generateAdmitCardPDF(application);

    // Update application
    application.admitCardGenerated = true;
    application.admitCardPath = pdfPath;
    await application.save();

    res.status(200).json({
      success: true,
      message: "Admit card generated successfully",
      data: {
        applicationNumber: application.applicationNumber,
        pdfPath: `/api/pdf/download/${applicationId}`,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Generate Admit Card Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate admit card. Please try again.",
    });
  }
};

/**
 * @desc    Download admit card PDF
 * @route   GET /api/pdf/download/:applicationId
 * @access  Private
 */
const downloadAdmitCard = async (req, res) => {
  try {
    const { applicationId } = req.params;

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
        message: "You are not authorized to download this admit card",
      });
    }

    // Check if payment is completed
    if (application.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment must be completed before downloading admit card",
      });
    }

    // Check if admit card is generated
    if (!application.admitCardGenerated || !application.admitCardPath) {
      return res.status(400).json({
        success: false,
        message: "Admit card not generated yet. Please generate it first.",
        generateUrl: `/api/pdf/generate/${applicationId}`,
      });
    }

    // Check if file exists
    if (!fs.existsSync(application.admitCardPath)) {
      // File deleted, regenerate
      application.admitCardGenerated = false;
      application.admitCardPath = null;
      await application.save();

      return res.status(404).json({
        success: false,
        message: "Admit card file not found. Please generate it again.",
        generateUrl: `/api/pdf/generate/${applicationId}`,
      });
    }

    // Set headers for download
    const filename = `Admit_Card_${application.applicationNumber}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Length",
      fs.statSync(application.admitCardPath).size,
    );

    // Stream file to response
    const fileStream = fs.createReadStream(application.admitCardPath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("File Stream Error:", error);
      res.status(500).json({
        success: false,
        message: "Error downloading admit card",
      });
    });
  } catch (error) {
    console.error("Download Admit Card Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download admit card",
    });
  }
};

/**
 * @desc    View admit card in browser (without download)
 * @route   GET /api/pdf/view/:applicationId
 * @access  Private
 */
const viewAdmitCard = async (req, res) => {
  try {
    const { applicationId } = req.params;

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
        message: "You are not authorized to view this admit card",
      });
    }

    // Check if payment is completed
    if (application.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment must be completed before viewing admit card",
      });
    }

    // Check if admit card is generated
    if (!application.admitCardGenerated || !application.admitCardPath) {
      return res.status(400).json({
        success: false,
        message: "Admit card not generated yet",
      });
    }

    // Check if file exists
    if (!fs.existsSync(application.admitCardPath)) {
      return res.status(404).json({
        success: false,
        message: "Admit card file not found",
      });
    }

    // Set headers for inline view
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");

    // Stream file to response
    const fileStream = fs.createReadStream(application.admitCardPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("View Admit Card Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to view admit card",
    });
  }
};

/**
 * @desc    Check if admit card is available
 * @route   GET /api/pdf/status/:applicationId
 * @access  Private
 */
const checkAdmitCardStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;

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
        message: "You are not authorized to check this admit card status",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        applicationNumber: application.applicationNumber,
        paymentStatus: application.paymentStatus,
        admitCardGenerated: application.admitCardGenerated,
        canGenerate:
          application.paymentStatus === "completed" &&
          application.status === "submitted",
        downloadUrl: application.admitCardGenerated
          ? `/api/pdf/download/${applicationId}`
          : null,
        viewUrl: application.admitCardGenerated
          ? `/api/pdf/view/${applicationId}`
          : null,
      },
    });
  } catch (error) {
    console.error("Check Admit Card Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check admit card status",
    });
  }
};

module.exports = {
  generateAdmitCard,
  downloadAdmitCard,
  viewAdmitCard,
  checkAdmitCardStatus,
};
