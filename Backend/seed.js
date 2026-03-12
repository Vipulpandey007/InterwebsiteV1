require("dotenv").config();
const mongoose = require("mongoose");

// Make sure these paths match where your models are located!
const Application = require("./models/Application");
const User = require("./models/User");

// Helper functions for generating random data
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNum = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomString = (length) => {
  let result = "";
  const characters = "0123456789";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/your_db_name",
    );
    console.log("✅ MongoDB Connected");

    // Optional: Uncomment the next two lines if you want to wipe old data before seeding
    // await Application.deleteMany({});
    // console.log("🗑️ Cleared existing applications");

    // 2. Create a Dummy User for the applications (OTP Based)
    let dummyUser = await User.findOne({ mobile: "9999999999" });

    if (!dummyUser) {
      dummyUser = await User.create({
        name: "Dummy Student",
        email: "dummy.student@test.com",
        mobile: "9999999999",
        role: "user",
        isVerified: true,
        isMobileVerified: true,
      });
      console.log("👤 Created Dummy Student User (OTP Based)");
    } else {
      console.log("👤 Dummy Student User already exists, reusing...");
    }

    // 3. Arrays of options based on your Enums
    const appliedForOptions = ["Science", "Commerce", "Arts"];
    const genderOptions = ["Male", "Female", "Other"];
    const categoryOptions = ["General", "OBC", "SC", "ST", "EWS"];
    const boardOptions = ["CBSE", "ICSE", "JAC", "Other"];
    const statusOptions = [
      "draft",
      "submitted",
      "under_review",
      "approved",
      "rejected",
    ];
    const paymentOptions = ["pending", "completed", "failed"];
    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const subjects = ["PCM", "PCB", "Accountancy", "History", "Economics"];

    // 4. Generate 20 Dummy Applications
    const dummyApplications = [];
    console.log("⏳ Generating 20 dummy applications...");

    for (let i = 1; i <= 20; i++) {
      const totalMarks = 500;
      const marksObtained = randomNum(250, 490);
      const appStatus = randomItem(statusOptions);
      const payStatus =
        appStatus === "draft" ? "pending" : randomItem(paymentOptions);

      dummyApplications.push({
        userId: dummyUser._id,
        applicationNumber: `GIC2026${randomString(6)}`,
        appliedFor: randomItem(appliedForOptions),
        session: "2026-2027",

        // Personal Details
        fullName: `Test Student ${i}`,
        fatherName: `Father Name ${i}`,
        motherName: `Mother Name ${i}`,
        dateOfBirth: new Date(
          randomNum(2005, 2010),
          randomNum(0, 11),
          randomNum(1, 28),
        ),
        gender: randomItem(genderOptions),
        category: randomItem(categoryOptions),
        religion: "Hinduism",
        contactNo: `98${randomString(8)}`,
        guardianContactNo: `97${randomString(8)}`,
        email: `student${i}@example.com`,
        aadharCard: randomString(12),
        bloodGroup: randomItem(bloodGroups),
        motherTongue: "Hindi",
        studentHeight: randomNum(140, 190),
        studentWeight: randomNum(40, 90),

        // Address
        presentAddress: `${randomNum(1, 100)}, Test Street, Test City, Jharkhand`,
        permanentAddress: `${randomNum(1, 100)}, Test Street, Test City, Jharkhand`,
        nationality: "Indian",

        // Education
        schoolName: `Test High School ${randomNum(1, 5)}`,
        board: randomItem(boardOptions),
        subject: randomItem(subjects),
        marksObtained: marksObtained,
        totalMarks: totalMarks,
        // percentage is auto-calculated by your pre-save hook!
        yearOfPassing: randomNum(2023, 2025),
        division: marksObtained > 300 ? "First" : "Second",

        // Status & Payment
        status: appStatus,
        amount: 1000,
        paymentStatus: payStatus,
        transactionId:
          payStatus === "completed" ? `pay_${randomString(10)}` : undefined,
        disclaimerAgreed: true,
      });
    }

    // 5. Insert into Database
    // Using a loop with .save() instead of insertMany so your pre('save') hook calculates the percentages
    for (const app of dummyApplications) {
      const newApp = new Application(app);
      await newApp.save();
    }

    console.log("🎉 Successfully inserted 20 dummy applications!");
  } catch (error) {
    console.error("❌ Seeding Error:", error);
  } finally {
    // 6. Disconnect
    mongoose.connection.close();
    console.log("🔌 MongoDB Disconnected");
    process.exit(0);
  }
};

seedDatabase();
