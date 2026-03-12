const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { adminLoginLimiter } = require("../middleware/rateLimiter");
const {
  adminLogin,
  getStats,
  getAllApplications,
  getApplicationById,
  updateApplication,
  updateApplicationStatus,
  createAdmin,
} = require("../controllers/adminController");

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public — 10 failed attempts per IP per 15 min
router.post("/login", adminLoginLimiter, adminLogin);

// @route   POST /api/admin/create
// @desc    Create admin user (initial setup only — disable after first use)
// @access  Public
router.post("/create", createAdmin);

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get("/stats", protect, adminOnly, getStats);

// @route   GET /api/admin/applications
// @desc    Get all applications (paginated + searchable: ?page=1&limit=20&status=all&search=)
// @access  Private (Admin only)
router.get("/applications", protect, adminOnly, getAllApplications);

// @route   GET /api/admin/applications/:id
// @desc    Get single application by ID
// @access  Private (Admin only)
router.get("/applications/:id", protect, adminOnly, getApplicationById);

// @route   PUT /api/admin/applications/:id
// @desc    Edit application fields (admin)
// @access  Private (Admin only)
router.put("/applications/:id", protect, adminOnly, updateApplication);

// @route   PUT /api/admin/applications/:id/status
// @desc    Update application status only
// @access  Private (Admin only)
router.put(
  "/applications/:id/status",
  protect,
  adminOnly,
  updateApplicationStatus,
);

module.exports = router;
