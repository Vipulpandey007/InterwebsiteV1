const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadFields } = require("../config/multerConfig");
const {
  createApplication,
  getMyApplications,
  getApplicationById,
  updateApplication,
  submitApplication,
  deleteApplication,
} = require("../controllers/applicationController");

// @route   POST /api/applications
// @desc    Create new application with file uploads
// @access  Private
router.post("/", protect, uploadFields, createApplication);

// @route   GET /api/applications/my-applications
// @desc    Get logged in user's applications
// @access  Private
router.get("/my-applications", protect, getMyApplications);

// @route   GET /api/applications/:id
// @desc    Get application by ID
// @access  Private
router.get("/:id", protect, getApplicationById);

// @route   PUT /api/applications/:id
// @desc    Update application
// @access  Private
router.put("/:id", protect, updateApplication);

// @route   POST /api/applications/:id/submit
// @desc    Submit application
// @access  Private
router.post("/:id/submit", protect, submitApplication);

// @route   DELETE /api/applications/:id
// @desc    Delete application
// @access  Private
router.delete("/:id", protect, deleteApplication);

module.exports = router;
