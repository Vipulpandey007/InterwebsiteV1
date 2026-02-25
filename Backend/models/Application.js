const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicationNumber: {
      type: String,
      unique: true,
    },

    // Basic Information
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },

    // Address Information
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    // Course Selection
    course: {
      type: String,
      required: [true, "Course selection is required"],
      trim: true,
    },

    // Academic Information
    twelfthMarks: {
      type: Number,
      required: [true, "12th marks are required"],
      min: [0, "Marks cannot be negative"],
      max: [100, "Marks cannot exceed 100"],
    },

    // Document Uploads (optional paths)
    documents: {
      photograph: {
        type: String,
        default: null,
      },
      marksheet: {
        type: String,
        default: null,
      },
      idProof: {
        type: String,
        default: null,
      },
    },

    // Payment Information
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    transactionId: {
      type: String,
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      default: 500, // Application fee
    },
    paymentDate: {
      type: Date,
      default: null,
    },

    // Application Status
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "approved", "rejected"],
      default: "draft",
    },

    // Submission timestamp
    submittedAt: {
      type: Date,
      default: null,
    },

    // PDF Generation
    admitCardGenerated: {
      type: Boolean,
      default: false,
    },
    admitCardPath: {
      type: String,
      default: null,
    },

    // Admin Review
    adminNotes: {
      type: String,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Generate unique application number before saving (atomic, race-condition-safe)
applicationSchema.pre("save", async function (next) {
  if (this.isNew && !this.applicationNumber) {
    try {
      const year = new Date().getFullYear();
      // Atomic increment using a Counter collection
      const Counter = mongoose.connection.collection("counters");
      const result = await Counter.findOneAndUpdate(
        { _id: `applicationNumber_${year}` },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" },
      );
      const seq = result.seq;
      this.applicationNumber = `APP${year}${String(seq).padStart(6, "0")}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Method to mark application as submitted
applicationSchema.methods.markAsSubmitted = function () {
  this.status = "submitted";
  this.submittedAt = new Date();
};

// Method to update payment status
applicationSchema.methods.updatePayment = function (paymentData) {
  this.paymentStatus = "completed";
  this.transactionId = paymentData.transactionId;
  this.razorpayPaymentId = paymentData.razorpayPaymentId;
  this.razorpayOrderId = paymentData.razorpayOrderId;
  this.razorpaySignature = paymentData.razorpaySignature;
  this.paymentDate = new Date();
};

// Indexes for faster queries
applicationSchema.index({ userId: 1 });
applicationSchema.index({ applicationNumber: 1 });
applicationSchema.index({ paymentStatus: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ email: 1 });
applicationSchema.index({ mobile: 1 });
applicationSchema.index({ createdAt: -1 });

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
