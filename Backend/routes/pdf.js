const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generatePDF,
  downloadPDF,
  getPDFStatus,
} = require("../controllers/pdfController");

// @route   POST /api/pdf/generate/:id
// @desc    Generate PDF admit card
// @access  Private
router.post("/generate/:id", protect, generatePDF);

// @route   GET /api/pdf/download/:id
// @desc    Download PDF admit card
// @access  Public (token in query params)
// NOTE: This route does NOT use protect middleware because token comes from query params
router.get("/download/:id", downloadPDF);

// @route   GET /api/pdf/status/:id
// @desc    Get PDF generation status
// @access  Private
router.get("/status/:id", protect, getPDFStatus);

module.exports = router;
