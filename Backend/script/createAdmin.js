const mongoose = require("mongoose");
const Admin = require("../models/Admin");
require("dotenv").config();

/**
 * Create initial admin user
 * Run: node utils/createAdmin.js
 */

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Admin details
    const adminData = {
      name: "Super Admin",
      email: "admin@college.edu",
      password: "admin123456", // Change this!
      mobile: "9999999999",
      role: "super_admin",
      isActive: true,
    };

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminData.email });

    if (existingAdmin) {
      console.log("Admin already exists with email:", adminData.email);
      console.log("Admin ID:", existingAdmin._id);
      process.exit(0);
    }

    // Create admin
    const admin = await Admin.create(adminData);

    console.log("✅ Admin created successfully!");
    console.log("=================================");
    console.log("Email:", admin.email);
    console.log("Password:", adminData.password);
    console.log("Role:", admin.role);
    console.log("=================================");
    console.log("⚠️  Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

// Run the script
createAdmin();
