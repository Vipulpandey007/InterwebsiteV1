const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const Application = require("../models/Application");

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  primary: "#1E3A5F", // deep navy
  accent: "#2563EB", // bright blue
  gold: "#D97706", // amber
  lightBg: "#F1F5F9", // slate-100
  sectionBg: "#EFF6FF", // blue-50
  border: "#CBD5E1", // slate-300
  text: "#1E293B", // slate-900
  muted: "#64748B", // slate-500
  white: "#FFFFFF",
  success: "#15803D", // green-700
  red: "#DC2626",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Draw a filled rectangle */
function fillRect(doc, x, y, w, h, color) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

/** Draw a stroked rectangle */
function strokeRect(doc, x, y, w, h, color, lw = 0.5) {
  doc.save().rect(x, y, w, h).lineWidth(lw).stroke(color).restore();
}

/** Horizontal rule */
function hr(doc, y, x1 = 40, x2 = 555, color = C.border, lw = 0.5) {
  doc.save().moveTo(x1, y).lineTo(x2, y).lineWidth(lw).stroke(color).restore();
}

/** Safe text (replace undefined/null with em-dash) */
const safe = (v) =>
  v !== undefined && v !== null && v !== "" ? String(v) : "—";

/** Format date string */
function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(d);
  }
}

// ── Section header ────────────────────────────────────────────────────────────
function sectionHeader(doc, title, y) {
  fillRect(doc, 40, y, 515, 22, C.sectionBg);
  strokeRect(doc, 40, y, 515, 22, C.accent, 0.5);
  doc
    .save()
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(C.primary)
    .text(title.toUpperCase(), 48, y + 6, { width: 499 })
    .restore();
  return y + 28;
}

// ── Two-column field row ──────────────────────────────────────────────────────
function fieldRow(doc, y, pairs) {
  const colW = 257;
  const gap = 6;
  pairs.forEach(([label, value], i) => {
    const x = 40 + i * (colW + gap);
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(C.muted)
      .text(label, x, y, { width: colW })
      .restore();
    doc
      .save()
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(C.text)
      .text(safe(value), x, y + 11, { width: colW })
      .restore();
  });
  return y + 30;
}

// ── Single full-width field ───────────────────────────────────────────────────
function fullField(doc, y, label, value) {
  doc
    .save()
    .fontSize(7.5)
    .font("Helvetica")
    .fillColor(C.muted)
    .text(label, 40, y, { width: 515 })
    .restore();
  doc
    .save()
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(C.text)
    .text(safe(value), 40, y + 11, { width: 515 })
    .restore();
  return y + 30;
}

// ── Address block ─────────────────────────────────────────────────────────────
function addressBlock(doc, y, label, addr) {
  if (!addr) return fullField(doc, y, label, "—");
  const parts = [
    addr.street,
    addr.city,
    addr.district,
    addr.state,
    addr.pincode ? `PIN: ${addr.pincode}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  return fullField(doc, y, label, parts || "—");
}

// ── Page header (repeated on each page) ──────────────────────────────────────
function drawPageHeader(doc) {
  const pageW = 595;

  // Top colour bar
  fillRect(doc, 0, 0, pageW, 56, C.primary);

  // College name
  doc
    .save()
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(C.white)
    .text("GOSSNER INTERMEDIATE COLLEGE, RANCHI", 0, 12, {
      align: "center",
      width: pageW,
    })
    .restore();

  // Sub-title
  doc
    .save()
    .fontSize(8.5)
    .font("Helvetica")
    .fillColor("#93C5FD")
    .text("Affiliated to JAC, Ranchi, Jharkhand", 0, 30, {
      align: "center",
      width: pageW,
    })
    .restore();

  // Form title strip
  fillRect(doc, 0, 56, pageW, 22, C.accent);
  doc
    .save()
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor(C.white)
    .text("APPLICATION FORM SUMMARY", 0, 62, { align: "center", width: pageW })
    .restore();
}

// ── Page footer ───────────────────────────────────────────────────────────────
function drawPageFooter(doc, pageNum, totalPages) {
  const y = 800;
  hr(doc, y, 40, 555, C.border);
  doc
    .save()
    .fontSize(7)
    .font("Helvetica")
    .fillColor(C.muted)
    .text(
      "This is a computer-generated document. No signature required.",
      40,
      y + 5,
      { width: 350 },
    )
    .text(`Page ${pageNum} of ${totalPages}`, 40, y + 5, {
      width: 515,
      align: "right",
    })
    .restore();
}

// ── Status badge ──────────────────────────────────────────────────────────────
function statusBadge(doc, status, paymentStatus, x, y) {
  const statusMap = {
    draft: { label: "DRAFT", bg: "#FEF3C7", fg: "#92400E" },
    submitted: { label: "SUBMITTED", bg: "#DBEAFE", fg: "#1E40AF" },
    approved: { label: "APPROVED", bg: "#DCFCE7", fg: "#166534" },
    rejected: { label: "REJECTED", bg: "#FEE2E2", fg: "#991B1B" },
  };
  const payMap = {
    pending: { label: "PAYMENT PENDING", bg: "#FEF9C3", fg: "#854D0E" },
    completed: { label: "PAID", bg: "#DCFCE7", fg: "#166534" },
    failed: { label: "PAYMENT FAILED", bg: "#FEE2E2", fg: "#991B1B" },
  };

  const s = statusMap[status] || {
    label: status?.toUpperCase() || "—",
    bg: C.lightBg,
    fg: C.muted,
  };
  const p = payMap[paymentStatus] || {
    label: paymentStatus?.toUpperCase() || "—",
    bg: C.lightBg,
    fg: C.muted,
  };

  // Status pill
  const sw = 90,
    sh = 18;
  fillRect(doc, x, y, sw, sh, s.bg);
  strokeRect(doc, x, y, sw, sh, s.fg, 0.5);
  doc
    .save()
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(s.fg)
    .text(s.label, x, y + 5, { width: sw, align: "center" })
    .restore();

  // Payment pill
  const pw = 110;
  fillRect(doc, x + sw + 8, y, pw, sh, p.bg);
  strokeRect(doc, x + sw + 8, y, pw, sh, p.fg, 0.5);
  doc
    .save()
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(p.fg)
    .text(p.label, x + sw + 8, y + 5, { width: pw, align: "center" })
    .restore();
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN CONTROLLER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Generate and stream application summary PDF
 * @route   GET /api/pdf/application-summary/:id
 * @access  Private (student must own the application)
 */
const generateApplicationSummary = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    // Only allow download if at least submitted (not a raw draft)
    if (
      application.status === "draft" &&
      application.paymentStatus !== "completed"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Please submit your application before downloading the summary.",
      });
    }

    // ── Build PDF ──────────────────────────────────────────────────────────
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 90, bottom: 60, left: 40, right: 40 },
      info: {
        Title: `Application Summary - ${application.fullName}`,
        Author: "Gossner Intermediate College",
        Subject: `Admission Application ${application.applicationNumber || ""}`,
      },
    });

    // Stream to response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="GIC_Application_${application.applicationNumber || application._id}.pdf"`,
    );
    doc.pipe(res);

    // We'll collect pages and re-draw footers — use a simple two-pass
    // approach: just count pages as we render and add footer on pageAdded event.
    let pageNum = 1;
    doc.on("pageAdded", () => {
      pageNum++;
    });

    // ── PAGE 1 ─────────────────────────────────────────────────────────────
    drawPageHeader(doc);

    let y = 92; // below header

    // ── Application meta bar ────────────────────────────────────────────────
    fillRect(doc, 40, y, 515, 48, C.lightBg);
    strokeRect(doc, 40, y, 515, 48, C.border);

    // Photo placeholder / actual photo
    const photoFile = application.documents?.studentPhoto;
    const photoPath = photoFile
      ? path.join(__dirname, "../uploads/photos", photoFile)
      : null;

    const photoX = 460,
      photoY = y + 4,
      photoW = 88,
      photoH = 40;

    if (photoPath && fs.existsSync(photoPath)) {
      try {
        doc
          .save()
          .rect(photoX, photoY, photoW, photoH)
          .clip()
          .image(photoPath, photoX, photoY, {
            width: photoW,
            height: photoH,
            cover: [photoW, photoH],
          })
          .restore();
        strokeRect(doc, photoX, photoY, photoW, photoH, C.border);
      } catch {
        // photo load failed — draw placeholder
        fillRect(doc, photoX, photoY, photoW, photoH, "#E2E8F0");
        doc
          .save()
          .fontSize(7)
          .font("Helvetica")
          .fillColor(C.muted)
          .text("Photo", photoX, photoY + 15, {
            width: photoW,
            align: "center",
          })
          .restore();
      }
    } else {
      fillRect(doc, photoX, photoY, photoW, photoH, "#E2E8F0");
      doc
        .save()
        .fontSize(7)
        .font("Helvetica")
        .fillColor(C.muted)
        .text("Photo", photoX, photoY + 15, { width: photoW, align: "center" })
        .restore();
    }

    // Meta text left side
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(C.muted)
      .text("Application No.", 48, y + 6)
      .restore();
    doc
      .save()
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(C.primary)
      .text(safe(application.applicationNumber), 48, y + 16)
      .restore();

    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(C.muted)
      .text("Applied For", 200, y + 6)
      .restore();
    doc
      .save()
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(C.text)
      .text(safe(application.appliedFor), 200, y + 16)
      .restore();

    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(C.muted)
      .text("Session", 320, y + 6)
      .restore();
    doc
      .save()
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(C.text)
      .text(safe(application.session), 320, y + 16)
      .restore();

    // Status badges
    statusBadge(doc, application.status, application.paymentStatus, 48, y + 28);

    y += 60;

    // ── SECTION 1: Personal Details ─────────────────────────────────────────
    y = sectionHeader(doc, "1. Personal Details", y);
    y = fieldRow(doc, y, [
      ["Full Name", application.fullName],
      ["Date of Birth", fmtDate(application.dateOfBirth)],
    ]);
    y = fieldRow(doc, y, [
      ["Father's Name", application.fatherName],
      ["Mother's Name", application.motherName],
    ]);
    y = fieldRow(doc, y, [
      ["Gender", application.gender],
      ["Category", application.category],
    ]);
    y = fieldRow(doc, y, [
      ["Religion", application.religion],
      ["Mother Tongue", application.motherTongue],
    ]);
    y = fieldRow(doc, y, [
      ["Blood Group", application.bloodGroup],
      ["Nationality", application.nationality],
    ]);
    y = fieldRow(doc, y, [
      ["Height (cm)", application.studentHeight],
      ["Weight (kg)", application.studentWeight],
    ]);
    y = fieldRow(doc, y, [
      ["Aadhar Card No.", application.aadharCard],
      ["AAPAR ID", application.aaparId],
    ]);

    y += 4;
    hr(doc, y);
    y += 10;

    // ── SECTION 2: Contact Details ──────────────────────────────────────────
    y = sectionHeader(doc, "2. Contact Details", y);
    y = fieldRow(doc, y, [
      ["Mobile No.", application.contactNo],
      ["WhatsApp No.", application.whatsappNo],
    ]);
    y = fieldRow(doc, y, [
      ["Guardian Contact", application.guardianContactNo],
      ["Email Address", application.email],
    ]);

    y += 4;
    hr(doc, y);
    y += 10;

    // ── SECTION 3: Address Details ──────────────────────────────────────────
    y = sectionHeader(doc, "3. Address Details", y);
    y = addressBlock(doc, y, "Present Address", application.presentAddress);
    y = addressBlock(doc, y, "Permanent Address", application.permanentAddress);

    y += 4;
    hr(doc, y);
    y += 10;

    // ── Check if we need a new page ─────────────────────────────────────────
    if (y > 680) {
      drawPageFooter(doc, 1, 2);
      doc.addPage();
      drawPageHeader(doc);
      y = 92;
    }

    // ── SECTION 4: Academic Details ─────────────────────────────────────────
    y = sectionHeader(doc, "4. Academic Details (Class X / Matric)", y);
    y = fieldRow(doc, y, [
      ["School Name", application.schoolName],
      ["Board", application.board],
    ]);
    y = fieldRow(doc, y, [
      ["Subject / Stream", application.subject],
      ["Year of Passing", application.yearOfPassing],
    ]);
    y = fieldRow(doc, y, [
      ["Marks Obtained", application.marksObtained],
      ["Total Marks", application.totalMarks],
    ]);
    y = fieldRow(doc, y, [
      [
        "Percentage",
        application.percentage ? `${application.percentage}%` : "—",
      ],
      [
        "Division / Grade",
        `${safe(application.division)} / ${safe(application.grade)}`,
      ],
    ]);

    y += 4;
    hr(doc, y);
    y += 10;

    // ── SECTION 5: Uploaded Documents ──────────────────────────────────────
    y = sectionHeader(doc, "5. Uploaded Documents", y);

    const docList = [
      ["Student Photo", application.documents?.studentPhoto],
      ["10th Marksheet", application.documents?.tenthMarksheet],
      ["10th Admit Card", application.documents?.tenthAdmitCard],
      ["Transfer Certificate", application.documents?.transferCertificate],
      ["Character Certificate", application.documents?.characterCertificate],
      ["Migration Certificate", application.documents?.migration],
      ["Caste Certificate", application.documents?.casteCertificate],
      ["BPL Certificate", application.documents?.bplCertificate],
      ["Aadhar Card (Document)", application.documents?.aadharCardDoc],
    ];

    docList.forEach(([label, filename], i) => {
      const rowY = y + i * 20;
      if (i % 2 === 0)
        fillRect(doc, 40, rowY, 515, 20, i % 4 === 0 ? C.white : "#F8FAFC");

      const uploaded = !!filename;
      // Tick / cross
      doc
        .save()
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(uploaded ? C.success : C.red)
        .text(uploaded ? "✓" : "✗", 48, rowY + 5)
        .restore();
      doc
        .save()
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor(C.text)
        .text(label, 62, rowY + 5, { width: 300 })
        .restore();
      doc
        .save()
        .fontSize(8)
        .font("Helvetica")
        .fillColor(C.muted)
        .text(uploaded ? "Uploaded" : "Not uploaded", 390, rowY + 5, {
          width: 160,
          align: "right",
        })
        .restore();
      strokeRect(doc, 40, rowY, 515, 20, C.border, 0.3);
    });

    y += docList.length * 20 + 10;
    hr(doc, y);
    y += 10;

    // ── SECTION 6: Payment Details ──────────────────────────────────────────
    if (y > 700) {
      drawPageFooter(doc, pageNum, pageNum + 1);
      doc.addPage();
      drawPageHeader(doc);
      y = 92;
    }

    y = sectionHeader(doc, "6. Payment Details", y);
    y = fieldRow(doc, y, [
      ["Payment Status", application.paymentStatus?.toUpperCase() || "PENDING"],
      ["Amount", application.amount ? `₹${application.amount}` : "—"],
    ]);
    y = fieldRow(doc, y, [
      ["Transaction ID", application.transactionId],
      ["Razorpay Payment ID", application.razorpayPaymentId],
    ]);

    y += 4;
    hr(doc, y);
    y += 14;

    // ── Declaration box ──────────────────────────────────────────────────────
    fillRect(doc, 40, y, 515, 54, "#FFFBEB");
    strokeRect(doc, 40, y, 515, 54, C.gold, 0.8);
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .fillColor(C.gold)
      .text("DECLARATION", 48, y + 6)
      .restore();
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#78350F")
      .text(
        "I hereby declare that all the information provided in this application is true and correct to the best " +
          "of my knowledge. I understand that any false information may result in cancellation of my admission.",
        48,
        y + 18,
        { width: 499 },
      )
      .restore();
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(C.muted)
      .text(`Submitted on: ${fmtDate(application.updatedAt)}`, 48, y + 40)
      .restore();

    y += 70;

    // ── Signature lines ──────────────────────────────────────────────────────
    // Left: student
    hr(doc, y + 20, 48, 220, C.text, 0.5);
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(C.muted)
      .text("Applicant's Signature", 48, y + 24, {
        width: 172,
        align: "center",
      })
      .restore();

    // Right: principal (for office use)
    hr(doc, y + 20, 360, 530, C.text, 0.5);
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(C.muted)
      .text("Principal / Authorized Signatory", 360, y + 24, {
        width: 170,
        align: "center",
      })
      .restore();

    y += 50;

    // ── Watermark if draft ────────────────────────────────────────────────────
    if (application.status === "draft") {
      doc
        .save()
        .fontSize(72)
        .font("Helvetica-Bold")
        .fillColor("#E2E8F0")
        .opacity(0.25)
        .rotate(-45, { origin: [297, 420] })
        .text("DRAFT", 80, 380, { width: 450, align: "center" })
        .restore();
    }

    // Final footer
    drawPageFooter(doc, pageNum, pageNum);

    doc.end();
  } catch (error) {
    console.error("Application Summary PDF Error:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: "Failed to generate PDF" });
    }
  }
};

module.exports = { generateApplicationSummary };
