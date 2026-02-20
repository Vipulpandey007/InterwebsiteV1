const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generate Admit Card PDF
 * @param {Object} application - Application object from database
 * @returns {Promise<String>} Path to generated PDF
 */
const generateAdmitCardPDF = async (application) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF directory if it doesn't exist
      const pdfDir = path.join(__dirname, "../pdfs");
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // Generate filename
      const filename = `admit_card_${application.applicationNumber}_${Date.now()}.pdf`;
      const filepath = path.join(pdfDir, filename);

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      // Pipe to file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // ============= HEADER =============
      // College Logo/Name
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#1a237e")
        .text("COLLEGE NAME", { align: "center" });

      doc.moveDown(0.3);
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#666")
        .text("College Address, City, State - 123456", { align: "center" });

      doc.moveDown(0.2);
      doc.text("Phone: +91-1234567890 | Email: info@college.edu", {
        align: "center",
      });

      // Horizontal line
      doc.moveDown(1);
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor("#1a237e")
        .lineWidth(2)
        .stroke();

      // Title
      doc.moveDown(1);
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#1a237e")
        .text("ADMISSION ADMIT CARD", { align: "center" });

      doc.moveDown(0.5);
      doc
        .fontSize(14)
        .font("Helvetica")
        .fillColor("#666")
        .text(
          `Academic Year: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          { align: "center" },
        );

      // ============= APPLICATION DETAILS BOX =============
      doc.moveDown(1.5);
      const boxY = doc.y;

      // Draw box
      doc.rect(50, boxY, 495, 80).fillAndStroke("#f5f5f5", "#1a237e");

      // Application Number (Large)
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor("#000")
        .text("Application Number:", 70, boxY + 15);

      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .fillColor("#d32f2f")
        .text(application.applicationNumber, 220, boxY + 12);

      // Application Date
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#000")
        .text("Application Date:", 70, boxY + 40);

      doc.fontSize(10).text(
        new Date(application.submittedAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        220,
        boxY + 40,
      );

      // Payment Status
      doc.fontSize(10).text("Payment Status:", 70, boxY + 58);

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#2e7d32")
        .text("PAID ✓", 220, boxY + 58);

      doc.y = boxY + 100;

      // ============= CANDIDATE INFORMATION =============
      doc.moveDown(1);
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#1a237e")
        .text("CANDIDATE INFORMATION");

      doc.moveDown(0.5);
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor("#ddd")
        .lineWidth(1)
        .stroke();

      doc.moveDown(0.8);

      // Information in two columns
      const leftColumn = 70;
      const rightColumn = 320;
      let currentY = doc.y;

      // Helper function to add info row
      const addInfoRow = (label, value, x, y) => {
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor("#555")
          .text(label + ":", x, y);

        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#000")
          .text(value, x + 120, y);
      };

      // Left Column
      addInfoRow("Full Name", application.fullName, leftColumn, currentY);
      currentY += 25;
      addInfoRow("Father's Name", application.fatherName, leftColumn, currentY);
      currentY += 25;
      addInfoRow("Date of Birth", "N/A", leftColumn, currentY);
      currentY += 25;
      addInfoRow("Mobile Number", application.mobile, leftColumn, currentY);

      // Right Column
      currentY = doc.y;
      addInfoRow(
        "Email Address",
        application.email.length > 25
          ? application.email.substring(0, 22) + "..."
          : application.email,
        rightColumn,
        currentY,
      );
      currentY += 25;
      addInfoRow(
        "12th Marks",
        application.twelfthMarks + "%",
        rightColumn,
        currentY,
      );
      currentY += 25;
      addInfoRow(
        "Course Applied",
        application.course.length > 18
          ? application.course.substring(0, 15) + "..."
          : application.course,
        rightColumn,
        currentY,
      );

      doc.y = currentY + 35;

      // ============= ADDRESS =============
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#1a237e")
        .text("ADDRESS");

      doc.moveDown(0.5);
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor("#ddd")
        .lineWidth(1)
        .stroke();

      doc.moveDown(0.8);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#000")
        .text(application.address, { width: 495, align: "left" });

      // ============= PAYMENT DETAILS =============
      doc.moveDown(2);
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#1a237e")
        .text("PAYMENT DETAILS");

      doc.moveDown(0.5);
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor("#ddd")
        .lineWidth(1)
        .stroke();

      doc.moveDown(0.8);
      currentY = doc.y;

      addInfoRow(
        "Transaction ID",
        application.transactionId,
        leftColumn,
        currentY,
      );
      currentY += 25;
      addInfoRow(
        "Amount Paid",
        "₹ " + application.amount,
        leftColumn,
        currentY,
      );
      currentY += 25;
      addInfoRow(
        "Payment Date",
        new Date(application.paymentDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        leftColumn,
        currentY,
      );

      addInfoRow("Payment Mode", "Online (Razorpay)", rightColumn, doc.y);

      // ============= INSTRUCTIONS =============
      doc.moveDown(3);
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#1a237e")
        .text("IMPORTANT INSTRUCTIONS:");

      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#000")
        .list(
          [
            "Bring this admit card on the day of examination/interview.",
            "Carry a valid photo ID proof (Aadhar Card/Driving License/Passport).",
            "Report at the examination center 30 minutes before scheduled time.",
            "Mobile phones and electronic devices are strictly prohibited.",
            "This admit card is non-transferable and must be preserved carefully.",
          ],
          { bulletRadius: 2, textIndent: 15, width: 480 },
        );

      // ============= FOOTER =============
      doc.moveDown(2);
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor("#ddd")
        .lineWidth(1)
        .stroke();

      doc.moveDown(1);

      // Signature placeholder
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#000")
        .text("Authorized Signatory", 400, doc.y, {
          width: 145,
          align: "center",
        });

      doc.moveDown(2);

      // Barcode/QR Code placeholder (optional)
      doc
        .fontSize(7)
        .font("Helvetica")
        .fillColor("#999")
        .text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 50, doc.y);

      doc.text(`Verification Code: ${application.applicationNumber}`, {
        align: "right",
      });

      // ============= WATERMARK =============
      doc
        .fontSize(60)
        .font("Helvetica-Bold")
        .fillColor("#f0f0f0")
        .rotate(-45, { origin: [300, 400] })
        .text("ADMIT CARD", 150, 400, { width: 400, align: "center" })
        .rotate(45, { origin: [300, 400] });

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      stream.on("finish", () => {
        resolve(filepath);
      });

      stream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Check if PDF already exists for application
 * @param {String} applicationNumber - Application number
 * @returns {String|null} Path to PDF if exists, null otherwise
 */
const checkExistingPDF = (applicationNumber) => {
  const pdfDir = path.join(__dirname, "../pdfs");

  if (!fs.existsSync(pdfDir)) {
    return null;
  }

  const files = fs.readdirSync(pdfDir);
  const existingPDF = files.find((file) =>
    file.startsWith(`admit_card_${applicationNumber}_`),
  );

  return existingPDF ? path.join(pdfDir, existingPDF) : null;
};

/**
 * Delete old PDFs for an application
 * @param {String} applicationNumber - Application number
 */
const deleteOldPDFs = (applicationNumber) => {
  const pdfDir = path.join(__dirname, "../pdfs");

  if (!fs.existsSync(pdfDir)) {
    return;
  }

  const files = fs.readdirSync(pdfDir);
  files.forEach((file) => {
    if (file.startsWith(`admit_card_${applicationNumber}_`)) {
      fs.unlinkSync(path.join(pdfDir, file));
    }
  });
};

module.exports = {
  generateAdmitCardPDF,
  checkExistingPDF,
  deleteOldPDFs,
};
