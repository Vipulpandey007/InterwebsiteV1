const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  createAdmissionOrder,
  verifyAdmissionPayment,
  markOfflinePaid,
  getFeeStats,
  getFeeList,
} = require("../controllers/admissionFeeController");

const {
  generateAdmissionFeeReceipt,
} = require("../controllers/admissionFeeReceiptController");

// ── Student routes ────────────────────────────────────────────────────────────

// Create Razorpay order for admission fee
router.post("/create-order", protect, createAdmissionOrder);

// Verify Razorpay payment for admission fee
router.post("/verify", protect, verifyAdmissionPayment);

// Download admission fee receipt PDF
// Token via ?token= query string — same pattern as /api/pdf/download/:id
router.get("/receipt/:id", protect, generateAdmissionFeeReceipt);

// ── Admin routes ──────────────────────────────────────────────────────────────

// Fee management stats (stat cards at top of panel)
router.get("/stats", protect, adminOnly, getFeeStats);

// Paginated fee list (paid / pending / offline)
router.get("/list", protect, adminOnly, getFeeList);

// Mark an application's admission fee as paid offline (cash / DD)
router.post("/:id/mark-offline", protect, adminOnly, markOfflinePaid);

module.exports = router;
