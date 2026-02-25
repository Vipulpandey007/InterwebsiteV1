const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    name: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // OTP fields
    otp: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    otpLockedUntil: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Generate a 6-digit OTP and store its hash + expiry on the user document.
 * Returns the plain OTP to be sent to the user.
 */
userSchema.methods.generateOTP = function () {
  // Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store hashed OTP (avoid storing plain text in DB)
  this.otp = crypto.createHash("sha256").update(otp).digest("hex");

  // OTP expires in 10 minutes
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  // Reset attempts on new OTP generation
  this.otpAttempts = 0;
  this.otpLockedUntil = null;

  return otp; // Return plain OTP to send via SMS
};

/**
 * Verify the provided OTP against the stored hash.
 * Tracks failed attempts and locks account after 5 failures.
 * Returns true if valid, false otherwise.
 */
userSchema.methods.verifyOTP = function (candidateOTP) {
  // Check if account is locked
  if (this.otpLockedUntil && this.otpLockedUntil > new Date()) {
    return false;
  }

  // Check if OTP exists and hasn't expired
  if (!this.otp || !this.otpExpiry || this.otpExpiry < new Date()) {
    return false;
  }

  // Hash the candidate OTP and compare
  const hashedCandidate = crypto
    .createHash("sha256")
    .update(candidateOTP)
    .digest("hex");

  const isValid = this.otp === hashedCandidate;

  if (!isValid) {
    // Increment failed attempts
    this.otpAttempts = (this.otpAttempts || 0) + 1;

    // Lock after 5 failed attempts for 15 minutes
    if (this.otpAttempts >= 5) {
      this.otpLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
  }

  return isValid;
};

/**
 * Clear OTP fields after successful verification.
 * Also marks the user as verified.
 */
userSchema.methods.clearOTP = function () {
  this.otp = null;
  this.otpExpiry = null;
  this.otpAttempts = 0;
  this.otpLockedUntil = null;
  this.isVerified = true;
};

// Indexes for faster queries
userSchema.index({ mobile: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
