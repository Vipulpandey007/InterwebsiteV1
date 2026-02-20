const express = require("express");
const router = express.Router();
const {
  generateAdmitCard,
  downloadAdmitCard,
  viewAdmitCard,
  checkAdmitCardStatus,
} = require("../controllers/pdfController");
const { protect } = require("../middleware/authMiddleware");

/**
 * All routes are protected - user must be logged in
 */

// @route   POST /api/pdf/generate/:applicationId
// @desc    Generate admit card PDF
// @access  Private
router.post("/generate/:applicationId", protect, generateAdmitCard);

// @route   GET /api/pdf/download/:applicationId
// @desc    Download admit card PDF
// @access  Private
router.get("/download/:applicationId", protect, downloadAdmitCard);

// @route   GET /api/pdf/view/:applicationId
// @desc    View admit card PDF in browser
// @access  Private
router.get("/view/:applicationId", protect, viewAdmitCard);

// @route   GET /api/pdf/status/:applicationId
// @desc    Check admit card generation status
// @access  Private
router.get("/status/:applicationId", protect, checkAdmitCardStatus);

module.exports = router;
