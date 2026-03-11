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
      required: true,
    },

    // Basic Application Info
    appliedFor: {
      type: String,
      required: [true, "Applied for field is required"],
      enum: ["Science", "Commerce", "Arts"],
    },
    session: {
      type: String,
      required: [true, "Session is required"],
      default: "2026-2027",
    },
    referenceNumber: {
      type: String,
    },

    // Student Personal Details
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
    motherName: {
      type: String,
      required: [true, "Mother's name is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "Other"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["General", "OBC", "SC", "ST", "EWS"],
    },
    religion: {
      type: String,
      required: [true, "Religion is required"],
    },
    contactNo: {
      type: String,
      required: [true, "Contact number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit contact number"],
    },
    whatsappNo: {
      type: String,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit WhatsApp number"],
    },
    guardianContactNo: {
      type: String,
      required: [true, "Guardian contact number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit contact number"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    aadharCard: {
      type: String,
      required: [true, "Aadhar card number is required"],
      match: [/^[0-9]{12}$/, "Please enter a valid 12-digit Aadhar number"],
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
    },
    motherTongue: {
      type: String,
      required: [true, "Mother tongue is required"],
    },
    studentHeight: {
      type: Number,
      required: [true, "Student height is required"],
    },
    studentWeight: {
      type: Number,
      required: [true, "Student weight is required"],
    },

    // Address Details
    presentAddress: {
      type: String,
      required: [true, "Present address is required"],
    },
    permanentAddress: {
      type: String,
      required: [true, "Permanent address is required"],
    },
    aaparId: {
      type: String,
    },
    nationality: {
      type: String,
      required: [true, "Nationality is required"],
      default: "Indian",
    },

    // Educational Qualification
    schoolName: {
      type: String,
      required: [true, "School name is required"],
    },
    board: {
      type: String,
      required: [true, "Board is required"],
      enum: ["CBSE", "ICSE", "JAC", "Other"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
    },
    marksObtained: {
      type: Number,
      required: [true, "Marks obtained is required"],
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks is required"],
      min: 0,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
    },
    yearOfPassing: {
      type: Number,
      required: [true, "Year of passing is required"],
      min: 2000,
      max: 2030,
    },
    division: {
      type: String,
      enum: ["First", "Second", "Third", ""],
    },

    // Documents (file paths)
    documents: {
      tenthMarksheet: String,
      tenthAdmitCard: String,
      transferCertificate: String,
      characterCertificate: String,
      migration: String,
      casteCertificate: String,
      bplCertificate: String,
      aadharCardDoc: String,
      studentPhoto: String,
    },

    // Application Status
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "approved", "rejected"],
      default: "draft",
    },

    // Payment Details
    amount: {
      type: Number,
      default: 1000,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    transactionId: {
      type: String,
    },
    paymentDate: {
      type: Date,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },

    // Admit Card
    admitCardGenerated: {
      type: Boolean,
      default: false,
    },

    // Disclaimer Agreement
    disclaimerAgreed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Auto-calculate percentage before save
applicationSchema.pre("save", function (next) {
  if (this.marksObtained && this.totalMarks) {
    this.percentage = parseFloat(
      ((this.marksObtained / this.totalMarks) * 100).toFixed(2),
    );
  }
  next();
});

// Virtual for age calculation
applicationSchema.virtual("age").get(function () {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }
  return null;
});

// Index: status — used in admin filters (approved/rejected/pending)
applicationSchema.index({ status: 1 });

// Index: createdAt — used in all sorts (newest first)
applicationSchema.index({ createdAt: -1 });

// Index: userId — used in getMyApplications and auth checks
applicationSchema.index({ userId: 1 });

// Index: applicationNumber — used in search and PDF generation
applicationSchema.index({ applicationNumber: 1 });

// Index: paymentStatus — used in revenue aggregation in getStats
applicationSchema.index({ paymentStatus: 1 });

// Compound index: status + createdAt — used in admin filtered+sorted list
applicationSchema.index({ status: 1, createdAt: -1 });

module.exports =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);
