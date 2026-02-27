const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      unique: true,
      match: [/^[0-9]{10}$/, "Please enter valid mobile"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter valid email"],
    },
    name: {
      type: String,
      required: true,
      minlength: 2,
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
    otp: String,
    otpExpires: Date,
    lastLogin: Date,
  },
  { timestamps: true },
);

// Methods
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};

userSchema.methods.verifyOTP = function (candidateOTP) {
  if (!this.otp) return false;
  if (this.otpExpires < new Date()) return false;
  return this.otp === candidateOTP;
};

userSchema.methods.clearOTP = function () {
  this.otp = undefined;
  this.otpExpires = undefined;
};

userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
