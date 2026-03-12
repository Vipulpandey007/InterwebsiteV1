/**
 * createAdmin.js — Run once to create an admin account
 *
 * Usage:
 *   cd Backend
 *   node createAdmin.js
 *
 * Or with custom values:
 *   ADMIN_NAME="Principal" ADMIN_EMAIL="principal@gcraninter.org" ADMIN_PASSWORD="MyPass123" ADMIN_MOBILE="9876543210" node createAdmin.js
 */

const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

// ── Default credentials — change before running ──────────────────────────────
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gcraninter.org";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_MOBILE = process.env.ADMIN_MOBILE || "9000000000";
// ─────────────────────────────────────────────────────────────────────────────

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 5,
    });
    console.log("✅ Connected to MongoDB");

    // Load User model AFTER connect
    const User = require("../models/User");

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`⚠️  Admin already exists: ${ADMIN_EMAIL}`);
      console.log(`   Role: ${existing.role}`);
      console.log("\nTo reset the password, delete the existing user first:");
      console.log(`   db.users.deleteOne({ email: "${ADMIN_EMAIL}" })`);
      process.exit(0);
    }

    // Create admin user (password is hashed by the pre-save hook in User.js)
    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      mobile: ADMIN_MOBILE,
      password: ADMIN_PASSWORD,
      role: "admin",
      isVerified: true,
      isMobileVerified: true,
    });

    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║        Admin Created Successfully        ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log(`  Name    : ${admin.name}`);
    console.log(`  Email   : ${admin.email}`);
    console.log(`  Mobile  : ${admin.mobile}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`  Role    : ${admin.role}`);
    console.log(`  ID      : ${admin._id}`);
    console.log("\n⚠️  Save these credentials somewhere safe!");
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

createAdmin();
