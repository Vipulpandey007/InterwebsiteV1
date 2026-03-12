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

// ── Create new application (with file uploads) ──────────────────────────────
router.post("/", protect, uploadFields, createApplication);

// ── Get student's own applications ──────────────────────────────────────────
router.get("/my-applications", protect, getMyApplications);

// ── Get single application ───────────────────────────────────────────────────
router.get("/:id", protect, getApplicationById);

// ── Update draft application (with optional file uploads) ───────────────────
router.put("/:id", protect, uploadFields, updateApplication);

// ── Submit application (changes status draft → submitted) ───────────────────
router.post("/:id/submit", protect, submitApplication);

// ── Delete draft application ─────────────────────────────────────────────────
router.delete("/:id", protect, deleteApplication);

module.exports = router;
