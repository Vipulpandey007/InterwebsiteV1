const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { pdfLimiter } = require("../middleware/rateLimiter");
const { generatePDF, downloadPDF } = require("../controllers/pdfController");
const {
  generateApplicationSummary,
} = require("../controllers/applicationSummaryController");

// @route   POST /api/pdf/generate/:id
// @desc    Generate admit card PDF
// @access  Private — rate limited (10 requests / 10 min per IP)
router.post("/generate/:id", protect, pdfLimiter, generatePDF);

// @route   GET /api/pdf/download/:id
// @desc    Download admit card PDF
// @access  Private — rate limited (10 requests / 10 min per IP)
router.get("/download/:id", protect, pdfLimiter, downloadPDF);

// @route   GET /api/pdf/application-summary/:id
// @desc    Download full application form as PDF (student)
// @access  Private — rate limited
router.get(
  "/application-summary/:id",
  protect,
  pdfLimiter,
  generateApplicationSummary,
);

module.exports = router;
