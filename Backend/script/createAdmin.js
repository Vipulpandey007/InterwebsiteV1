// createAdmin.js
// Run this script to create an admin user
// Usage: node createAdmin.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Admin details - CHANGE THESE!
const ADMIN_DATA = {
  name: "Admin User",
  email: "admin@gcraninter.org",
  password: "admin123",
  mobile: "9876543210",
};

// User Schema (simplified)
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    mobile: { type: String, unique: true },
    password: String,
    role: { type: String, default: "user" },
    isVerified: { type: Boolean, default: false },
    isMobileVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function createAdmin() {
  try {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     ADMIN USER CREATOR                 ║");
    console.log("╚════════════════════════════════════════╝\n");

    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_DATA.email });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("   Email:", existingAdmin.email);
      console.log("   Name:", existingAdmin.name);
      console.log(
        "\n💡 To create a different admin, change the email in this script.\n",
      );

      // Ask if they want to reset password
      console.log("🔧 To reset password, delete the existing user first:");
      console.log(
        '   In MongoDB: db.users.deleteOne({ email: "' +
          ADMIN_DATA.email +
          '" })',
      );
      console.log("   Then run this script again.\n");

      process.exit(0);
    }

    // Hash password
    console.log("🔒 Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_DATA.password, salt);
    console.log("✅ Password hashed\n");

    // Create admin user
    console.log("👤 Creating admin user...");
    const admin = await User.create({
      name: ADMIN_DATA.name,
      email: ADMIN_DATA.email,
      mobile: ADMIN_DATA.mobile,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
      isMobileVerified: true,
    });

    console.log("✅ Admin user created successfully!\n");
    console.log("╔════════════════════════════════════════╗");
    console.log("║     ADMIN CREDENTIALS                  ║");
    console.log("╠════════════════════════════════════════╣");
    console.log("║  Email:    " + admin.email.padEnd(29) + "║");
    console.log("║  Password: " + ADMIN_DATA.password.padEnd(29) + "║");
    console.log("║  Name:     " + admin.name.padEnd(29) + "║");
    console.log("║  Mobile:   " + admin.mobile.padEnd(29) + "║");
    console.log("╚════════════════════════════════════════╝\n");

    console.log("🌐 Login URL: http://localhost:5173/admin/login");
    console.log("⚠️  IMPORTANT: Change the password after first login!\n");
  } catch (error) {
    console.error("\n❌ Error creating admin:", error.message);

    if (error.code === 11000) {
      console.log("\n💡 This email or mobile number already exists.");
      console.log("   Change the email/mobile in the script and try again.\n");
    }
  } finally {
    await mongoose.connection.close();
    console.log("📡 Database connection closed.\n");
    process.exit(0);
  }
}

// Run the script
createAdmin();
