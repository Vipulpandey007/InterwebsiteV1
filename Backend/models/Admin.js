const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Don't include password in queries by default
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "reviewer"],
      default: "admin",
    },
    permissions: [
      {
        type: String,
        enum: [
          "view_applications",
          "review_applications",
          "manage_users",
          "manage_admins",
          "view_reports",
          "manage_settings",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
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

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get permissions based on role
adminSchema.methods.getPermissions = function () {
  const rolePermissions = {
    super_admin: [
      "view_applications",
      "review_applications",
      "manage_users",
      "manage_admins",
      "view_reports",
      "manage_settings",
    ],
    admin: [
      "view_applications",
      "review_applications",
      "manage_users",
      "view_reports",
    ],
    reviewer: ["view_applications", "review_applications"],
  };

  return this.permissions.length > 0
    ? this.permissions
    : rolePermissions[this.role] || [];
};

// Index for faster queries
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
