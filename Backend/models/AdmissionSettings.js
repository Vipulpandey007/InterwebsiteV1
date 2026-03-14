const mongoose = require("mongoose");

/**
 * Singleton model — only one document ever exists (the portal settings).
 * Use AdmissionSettings.getSettings() to always get/create it.
 */
const admissionSettingsSchema = new mongoose.Schema(
  {
    session: {
      type: String,
      default: "2026-27",
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    openDate: {
      type: Date,
      default: null,
    },
    closeDate: {
      type: Date,
      default: null,
    },
    closedMessage: {
      type: String,
      default: "Applications for this session are now closed.",
    },
    // ── Per-course admission fee schedule ─────────────────────────────────────
    // Admin configures these from Settings. On approval, backend stamps the
    // resolved amount onto the application (application.admissionFeeAmount).
    admissionFees: [
      {
        course: {
          type: String, // matches application.appliedFor: "Science"|"Commerce"|"Arts"
          required: true,
        },
        category: {
          type: String, // "General"|"OBC"|"SC"|"ST"|"EWS"|"" (empty = all categories)
          default: "",
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  { timestamps: true },
);

// ── Static helper: always returns the one settings document ─────────────────
admissionSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// ── Virtual: is the portal currently accepting applications? ─────────────────
admissionSettingsSchema.virtual("isAccepting").get(function () {
  if (!this.isOpen) return false;
  const now = new Date();
  if (this.openDate && now < this.openDate) return false;
  if (this.closeDate && now > this.closeDate) return false;
  return true;
});

module.exports = mongoose.model("AdmissionSettings", admissionSettingsSchema);
