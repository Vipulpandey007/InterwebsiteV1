const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createApplication,
  getMyApplications,
  getApplicationById,
  updateApplication,
  submitApplication,
  deleteApplication,
} = require("../controllers/applicationController");

// Create new application
router.post("/", protect, createApplication);

// Get my applications
router.get("/my-applications", protect, getMyApplications);

// Get application by ID
router.get("/:id", protect, getApplicationById);

// Update application
router.put("/:id", protect, updateApplication);

// Submit application
router.post("/:id/submit", protect, submitApplication);

// Delete application
router.delete("/:id", protect, deleteApplication);

module.exports = router;
