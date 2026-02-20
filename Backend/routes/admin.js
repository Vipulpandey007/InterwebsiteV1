const express = require("express");
const router = express.Router();

// Import controllers
const {
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  adminLogout,
} = require("../controllers/adminAuthController");

const {
  getDashboardStats,
  getStudentsList,
  getStudentDetails,
  getPaymentStats,
  exportStudentsData,
} = require("../controllers/adminDashboardController");

// Import middleware
const {
  adminProtect,
  checkPermission,
} = require("../middleware/authMiddleware");

// ==================== AUTHENTICATION ROUTES ====================

// @route   POST /api/admin/auth/login
// @desc    Admin login
// @access  Public
router.post("/auth/login", adminLogin);

// @route   GET /api/admin/auth/me
// @desc    Get admin profile
// @access  Private (Admin)
router.get("/auth/me", adminProtect, getAdminProfile);

// @route   PUT /api/admin/auth/profile
// @desc    Update admin profile
// @access  Private (Admin)
router.put("/auth/profile", adminProtect, updateAdminProfile);

// @route   PUT /api/admin/auth/change-password
// @desc    Change admin password
// @access  Private (Admin)
router.put("/auth/change-password", adminProtect, changeAdminPassword);

// @route   POST /api/admin/auth/logout
// @desc    Admin logout
// @access  Private (Admin)
router.post("/auth/logout", adminProtect, adminLogout);

// ==================== DASHBOARD ROUTES ====================

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin with view_reports permission)
router.get(
  "/dashboard/stats",
  adminProtect,
  checkPermission("view_reports"),
  getDashboardStats,
);

// @route   GET /api/admin/dashboard/students
// @desc    Get list of all students/applications
// @access  Private (Admin with view_applications permission)
router.get(
  "/dashboard/students",
  adminProtect,
  checkPermission("view_applications"),
  getStudentsList,
);

// @route   GET /api/admin/dashboard/students/:id
// @desc    Get single student/application details
// @access  Private (Admin with view_applications permission)
router.get(
  "/dashboard/students/:id",
  adminProtect,
  checkPermission("view_applications"),
  getStudentDetails,
);

// @route   GET /api/admin/dashboard/payments
// @desc    Get payment statistics
// @access  Private (Admin with view_reports permission)
router.get(
  "/dashboard/payments",
  adminProtect,
  checkPermission("view_reports"),
  getPaymentStats,
);

// @route   GET /api/admin/dashboard/export
// @desc    Export students data to CSV
// @access  Private (Admin with view_reports permission)
router.get(
  "/dashboard/export",
  adminProtect,
  checkPermission("view_reports"),
  exportStudentsData,
);

module.exports = router;
