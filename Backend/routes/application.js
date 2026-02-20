const express = require("express");
const router = express.Router();
const {
  createApplication,
  updateApplication,
  getApplicationById,
  getMyApplications,
  submitApplication,
  deleteApplication,
  getApplicationStats,
} = require("../controllers/applicationController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateCreateApplication,
  validateUpdateApplication,
} = require("../middleware/validationMiddleware");

/**
 * All routes are protected - user must be logged in
 */

// @route   POST /api/applications
// @desc    Create new application
// @access  Private
router.post("/", protect, validateCreateApplication, createApplication);

// @route   GET /api/applications/my-applications
// @desc    Get all applications for logged-in user
// @access  Private
// Note: This route must be before /:id to avoid conflicts
router.get("/my-applications", protect, getMyApplications);

// @route   GET /api/applications/stats
// @desc    Get application statistics
// @access  Private
router.get("/stats", protect, getApplicationStats);

// @route   GET /api/applications/:id
// @desc    Get single application by ID
// @access  Private
router.get("/:id", protect, getApplicationById);

// @route   PUT /api/applications/:id
// @desc    Update application (draft only)
// @access  Private
router.put("/:id", protect, validateUpdateApplication, updateApplication);

// @route   POST /api/applications/:id/submit
// @desc    Submit application (change status to submitted)
// @access  Private
router.post("/:id/submit", protect, submitApplication);

// @route   DELETE /api/applications/:id
// @desc    Delete application (draft only)
// @access  Private
router.delete("/:id", protect, deleteApplication);

module.exports = router;
