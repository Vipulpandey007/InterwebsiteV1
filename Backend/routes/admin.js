const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  adminLogin,
  getStats,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  updateApplication, // 1. ADDED THIS IMPORT
  createAdmin,
  getSettings,
  updateSettings,
} = require("../controllers/adminController");

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post("/login", adminLogin);

// @route   POST /api/admin/create
// @desc    Create admin user (for initial setup)
// @access  Public (should be protected in production)
router.post("/create", createAdmin);

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get("/stats", protect, adminOnly, getStats);

// @route   GET /api/admin/applications
// @desc    Get all applications
// @access  Private (Admin only)
router.get("/applications", protect, adminOnly, getAllApplications);

// @route   GET /api/admin/applications/:id
// @desc    Get application by ID
// @access  Private (Admin only)
router.get("/applications/:id", protect, adminOnly, getApplicationById);

// @route   PUT /api/admin/applications/:id
// @desc    Update entire application details
// @access  Private (Admin only)
router.put("/applications/:id", protect, adminOnly, updateApplication); // 2. ADDED THIS ROUTE

// @route   PUT /api/admin/applications/:id/status
// @desc    Update application status
// @access  Private (Admin only)
router.put(
  "/applications/:id/status",
  protect,
  adminOnly,
  updateApplicationStatus,
);

// @route   GET /api/admin/settings
// @desc    Get admission portal settings (public — students check this)
// @access  Public
router.get("/settings", getSettings);

// @route   PUT /api/admin/settings
// @desc    Update admission portal settings
// @access  Private (Admin only)
router.put("/settings", protect, adminOnly, updateSettings);

module.exports = router;
