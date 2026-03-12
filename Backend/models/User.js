const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please add a valid email"],
    },
    mobile: {
      type: String,
      required: [true, "Please add a mobile number"],
      unique: true,
      match: [/^[0-9]{10}$/, "Please add a valid 10-digit mobile number"],
    },
    password: {
      type: String,
      select: false, // Don't include password in queries by default
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
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    otpSentAt: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving (for admin users)
userSchema.pre("save", async function (next) {
  // Only hash if password is modified and exists
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password (for admin login)
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otpSentAt = new Date();
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (candidateOTP) {
  if (!this.otp || !this.otpExpires) {
    return false;
  }

  if (Date.now() > this.otpExpires) {
    return false;
  }

  return this.otp === candidateOTP;
};

// Clear OTP
userSchema.methods.clearOTP = function () {
  this.otp = null;
  this.otpExpires = null;
  this.otpSentAt = null;
};

// Update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = Date.now();
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
