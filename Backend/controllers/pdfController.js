const Application = require("../models/Application");
const PDFDocument = require("pdfkit");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

/**
 * @desc    Generate PDF admit card
 * @route   POST /api/pdf/generate/:id
 * @access  Private
 */
const generatePDF = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (application.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    application.admitCardGenerated = true;
    await application.save();

    res.status(200).json({
      success: true,
      message: "Admit card generated successfully",
      data: { application },
    });
  } catch (error) {
    console.error("Generate PDF Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
    });
  }
};

/**
 * @desc    Download PDF admit card (Gossner College Design with Photo)
 * @route   GET /api/pdf/download/:id
 * @access  Public (token in query params)
 */
const downloadPDF = async (req, res) => {
  try {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     PDF DOWNLOAD - GOSSNER DESIGN      ║");
    console.log("╚════════════════════════════════════════╝");

    // Verify token from query params
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!application.admitCardGenerated) {
      return res.status(400).json({
        success: false,
        message: "Admit card not generated",
      });
    }

    console.log("✅ Generating Gossner College PDF...");

    // Create PDF
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=application-${application.applicationNumber}.pdf`,
    );

    doc.pipe(res);

    // ========== HEADER ==========
    // College Logo Area (placeholder circle)
    doc.save();
    const logoPath = path.join(__dirname, "../assets/Intermediate Logo.jpg");

    doc.image(logoPath, 55, 50, {
      width: 60,
      height: 60,
    });
    doc.restore();

    // College Name and Address
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text("GOSSNER INTERMEDIATE COLLEGE, RANCHI", 130, 55, {
        width: 400,
        align: "left",
      });

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#333")
      .text(
        "Niral Enem Horo Marg, G.E.L. Church Compound, Ranchi-834001, Jharkhand.",
        130,
        78,
        { width: 400 },
      );

    doc
      .fontSize(9)
      .fillColor("#1e40af")
      .text("website: www.gcraninter.org", 130, 93, { width: 400 });

    // Horizontal line below header
    doc
      .moveTo(50, 125)
      .lineTo(545, 125)
      .strokeColor("#333")
      .lineWidth(1)
      .stroke();

    // ========== APPLICATION BASIC INFO ==========
    let yPos = 145;

    const drawField = (label, value, xPos, width = 150) => {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#000")
        .text(label, xPos, yPos);

      doc
        .font("Helvetica")
        .text(value || "", xPos + width, yPos, { width: 200 });
    };

    drawField("Application No.:", application.applicationNumber, 50, 100);

    yPos += 20;
    drawField("Applied For:", application.appliedFor, 50, 100);
    drawField("Session:", application.session, 220, 60);
    drawField(
      "Application Form Fee:",
      application.paymentStatus === "completed" ? "Paid" : "Not Paid",
      380,
      120,
    );

    yPos += 20;
    drawField("Transaction ID:", application.transactionId || "N/A", 50, 120);

    // ========== STUDENT PHOTO ==========
    // Draw photo box
    doc.save();
    doc.rect(460, 200, 80, 100).strokeColor("#999").lineWidth(1).stroke();

    // Try to load and display student photo
    if (application.documents && application.documents.studentPhoto) {
      try {
        const photoPath = path.join(
          // __dirname,
          // "..",
          application.documents.studentPhoto,
        );
        console.log("📸 Looking for photo at:", photoPath);

        if (fs.existsSync(photoPath)) {
          console.log("✅ Photo found, adding to PDF");
          doc.image(photoPath, 462, 205, {
            width: 76,
            height: 96,
            fit: [76, 96],
            align: "center",
            valign: "center",
          });
        } else {
          console.log("⚠️  Photo file not found at path");
          // Show "No Photo" text
          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#999")
            .text("No Photo", 470, 185, { width: 60, align: "center" });
        }
      } catch (error) {
        console.error("❌ Error loading photo:", error.message);
        // Show "Image" placeholder
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#999")
          .text("Image", 470, 185, { width: 60, align: "center" });
      }
    } else {
      console.log("⚠️  No photo uploaded");
      // Show "Image" placeholder
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#999")
        .text("Image", 470, 185, { width: 60, align: "center" });
    }
    doc.restore();

    yPos += 30;

    // ========== STUDENT'S PERSONAL DETAILS ==========
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text("Student's Personal Details:", 50, yPos);

    yPos += 25;

    const addRow = (label1, value1, label2, value2) => {
      doc.fontSize(9).font("Helvetica-Bold").text(label1, 50, yPos);
      doc.font("Helvetica").text(value1 || "", 150, yPos, { width: 150 });

      if (label2) {
        doc.font("Helvetica-Bold").text(label2, 300, yPos);
        doc.font("Helvetica").text(value2 || "", 400, yPos, { width: 140 });
      }

      yPos += 18;
    };

    addRow("Name:", application.fullName, "", "");

    addRow(
      "Father's Name:",
      application.fatherName,
      "Mother's Name:",
      application.motherName,
    );

    addRow(
      "D.O.B:",
      new Date(application.dateOfBirth).toLocaleDateString("en-GB"),
      "Gender:",
      application.gender,
    );

    addRow(
      "Category:",
      application.category,
      "Religion:",
      application.religion,
    );

    addRow(
      "Contact No.:",
      application.contactNo,
      "Guardian Contact No.:",
      application.guardianContactNo,
    );

    addRow(
      "WhatsApp No.:",
      application.whatsappNo || "N/A",
      "Email Id:",
      application.email,
    );

    addRow(
      "Aadhar Card:",
      application.aadharCard,
      "Blood Group:",
      application.bloodGroup || "N/A",
    );

    addRow(
      "Mother Tounge:",
      application.motherTongue,
      "Nationality:",
      application.nationality,
    );

    addRow(
      "Student Height (in Cm):",
      application.studentHeight?.toString() || "N/A",
      "Student Weight (in Kg):",
      application.studentWeight?.toString() || "N/A",
    );

    yPos += 5;

    doc.fontSize(9).font("Helvetica-Bold").text("Present Address:", 50, yPos);
    doc
      .font("Helvetica")
      .text(application.presentAddress || "", 150, yPos, { width: 390 });

    yPos += 35;

    doc.font("Helvetica-Bold").text("Permanent Address:", 50, yPos);
    doc
      .font("Helvetica")
      .text(application.permanentAddress || "", 150, yPos, { width: 390 });

    yPos += 35;

    addRow("AAPAR ID (Optional):", application.aaparId || "N/A", "", "");

    yPos += 15;

    // ========== EDUCATIONAL QUALIFICATION ==========
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text("Educational Qualification:", 50, yPos);

    yPos += 20;

    // Table
    const tableTop = yPos;
    const rowHeight = 30;

    const columns = [
      { label: "School Name", x: 50, width: 80 },
      { label: "Board", x: 135, width: 50 },
      { label: "Subject", x: 190, width: 60 },
      { label: "Marks Obtained", x: 255, width: 45 },
      { label: "Total Marks", x: 305, width: 40 },
      { label: "Percent age", x: 350, width: 40 },
      { label: "Grade", x: 395, width: 35 },
      { label: "Year of Passing", x: 435, width: 50 },
      { label: "Division", x: 490, width: 50 },
    ];

    // Draw table
    doc
      .rect(50, tableTop, 495, rowHeight * 2)
      .strokeColor("#000")
      .lineWidth(1)
      .stroke();

    // Header row
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#000");

    columns.forEach((col) => {
      doc.text(col.label, col.x + 2, tableTop + 5, {
        width: col.width - 4,
        align: "center",
      });
    });

    // Data row
    yPos = tableTop + rowHeight;
    doc.fontSize(8).font("Helvetica");

    const tableData = [
      application.schoolName,
      application.board,
      application.subject,
      application.marksObtained?.toString(),
      application.totalMarks?.toString(),
      application.percentage + "%",
      application.grade || "",
      application.yearOfPassing?.toString(),
      application.division || "",
    ];

    columns.forEach((col, index) => {
      doc.text(tableData[index] || "", col.x + 2, yPos + 8, {
        width: col.width - 4,
        align: "center",
      });
    });

    // Draw column separators
    for (let i = 1; i < columns.length; i++) {
      doc
        .moveTo(columns[i].x, tableTop)
        .lineTo(columns[i].x, tableTop + rowHeight * 2)
        .stroke();
    }

    // Draw row separator
    doc
      .moveTo(50, tableTop + rowHeight)
      .lineTo(545, tableTop + rowHeight)
      .stroke();

    yPos += rowHeight + 25;

    // ========== DOCUMENTS TO BE UPLOADED ==========
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Documents to be Uploaded:", 50, yPos);

    yPos += 20;

    const documents = [
      "1.  10th Marks Sheet",
      "2.  10th Admit Card",
      "3.  TC",
      "4.  Character Certificate",
      "5.  Migration",
      "6.  Caste Certificate (if Applicable)",
      "7.  BPL Certificate (if Applicable)",
      "8.  Aadhar Card",
    ];

    doc.fontSize(9).font("Helvetica").fillColor("#000");

    documents.forEach((docItem, index) => {
      if (index < 4) {
        doc.text(docItem, 70, yPos + index * 15, { width: 200 });
      } else {
        doc.text(docItem, 320, yPos + (index - 4) * 15, { width: 220 });
      }
    });

    yPos += 80;

    // ========== DISCLAIMER ==========
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Disclaimer By Applicant", 50, yPos, {
        align: "center",
        width: 495,
      });

    yPos += 25;

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#000")
      .text(
        "This is to certify that the above information is given by me is true in my knowledge. If it is found incorrect then the administration has right to cancel my admission any time. No claim will be applied by me or my family or friend in future.",
        50,
        yPos,
        { width: 495, align: "justify" },
      );

    // ========== FOOTER ==========
    yPos = 770;
    doc
      .fontSize(8)
      .fillColor("#666")
      .text(
        `Generated on: ${new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`,
        50,
        yPos,
        { align: "center", width: 495 },
      );

    doc.end();

    console.log("✅ Gossner College PDF generated successfully");
  } catch (error) {
    console.error("❌ PDF Download Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to download PDF",
      });
    }
  }
};

/**
 * @desc    Get PDF generation status
 * @route   GET /api/pdf/status/:id
 * @access  Private
 */
const getPDFStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        admitCardGenerated: application.admitCardGenerated,
        paymentStatus: application.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Get PDF Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get PDF status",
    });
  }
};

module.exports = {
  generatePDF,
  downloadPDF,
  getPDFStatus,
};
