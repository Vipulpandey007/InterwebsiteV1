const PDFDocument = require("pdfkit");
const Application = require("../models/Application");

// ── Colour palette (identical to applicationSummaryController) ────────────────
const C = {
  primary: "#1E3A5F",
  accent: "#2563EB",
  gold: "#D97706",
  lightBg: "#F1F5F9",
  sectionBg: "#EFF6FF",
  border: "#CBD5E1",
  text: "#1E293B",
  muted: "#64748B",
  white: "#FFFFFF",
  success: "#15803D",
  red: "#DC2626",
  green50: "#F0FDF4",
  green200: "#BBF7D0",
  amber50: "#FFFBEB",
};

// ── Shared drawing helpers (same as applicationSummaryController) ─────────────
function fillRect(doc, x, y, w, h, color) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}
function strokeRect(doc, x, y, w, h, color, lw = 0.5) {
  doc.save().rect(x, y, w, h).lineWidth(lw).stroke(color).restore();
}
function hr(doc, y, x1 = 40, x2 = 555, color = C.border, lw = 0.5) {
  doc.save().moveTo(x1, y).lineTo(x2, y).lineWidth(lw).stroke(color).restore();
}
const safe = (v) =>
  v !== undefined && v !== null && v !== "" ? String(v) : "—";

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

function fmtDateTime(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

// ── Page header ───────────────────────────────────────────────────────────────
function drawPageHeader(doc) {
  const pageW = 595;
  fillRect(doc, 0, 0, pageW, 56, C.primary);
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

  // Title strip — green for receipt (distinct from blue of application summary)
  fillRect(doc, 0, 56, pageW, 22, C.success);
  doc
    .save()
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor(C.white)
    .text("ADMISSION FEE RECEIPT", 0, 62, { align: "center", width: pageW })
    .restore();
}

// ── Page footer ───────────────────────────────────────────────────────────────
function drawPageFooter(doc) {
  const y = 800;
  hr(doc, y, 40, 555, C.border);
  doc
    .save()
    .fontSize(7)
    .font("Helvetica")
    .fillColor(C.muted)
    .text(
      "This is a computer-generated receipt. No signature required.",
      40,
      y + 5,
      { width: 350 },
    )
    .text(`Generated on: ${fmtDateTime(new Date())}`, 40, y + 5, {
      width: 515,
      align: "right",
    })
    .restore();
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
  const colW = 257,
    gap = 6;
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

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN CONTROLLER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Generate and stream admission fee receipt PDF
 * @route   GET /api/admission-fee/receipt/:id
 * @access  Private (student owns the application, token via ?token= query string)
 */
const generateAdmissionFeeReceipt = async (req, res) => {
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

    // Only allow if admission fee is actually paid
    if (application.admissionFeeStatus !== "completed") {
      return res.status(403).json({
        success: false,
        message: "Admission fee receipt is only available after fee payment.",
      });
    }

    // ── Build PDF ──────────────────────────────────────────────────────────
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 90, bottom: 60, left: 40, right: 40 },
      info: {
        Title: `Admission Fee Receipt - ${application.fullName}`,
        Author: "Gossner Intermediate College",
        Subject: `Admission Fee Receipt ${application.applicationNumber || ""}`,
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="GIC_AdmissionFee_Receipt_${application.applicationNumber || application._id}.pdf"`,
    );
    doc.pipe(res);

    // ── PAGE ───────────────────────────────────────────────────────────────
    drawPageHeader(doc);
    let y = 92;

    // ── Receipt meta bar ───────────────────────────────────────────────────
    fillRect(doc, 40, y, 515, 48, C.lightBg);
    strokeRect(doc, 40, y, 515, 48, C.border);

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

    // Payment mode badge
    const isOffline = application.markedPaidOffline;
    const badgeBg = isOffline ? "#FEF9C3" : C.green50;
    const badgeFg = isOffline ? "#854D0E" : C.success;
    const badgeLabel = isOffline ? "OFFLINE PAYMENT" : "ONLINE (RAZORPAY)";
    fillRect(doc, 48, y + 28, 110, 14, badgeBg);
    strokeRect(doc, 48, y + 28, 110, 14, badgeFg, 0.5);
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .fillColor(badgeFg)
      .text(badgeLabel, 48, y + 32, { width: 110, align: "center" })
      .restore();

    // PAID stamp
    fillRect(doc, 420, y + 6, 110, 32, C.green50);
    strokeRect(doc, 420, y + 6, 110, 32, C.success, 1);
    doc
      .save()
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(C.success)
      .text("PAID", 420, y + 14, { width: 110, align: "center" })
      .restore();

    y += 62;

    // ── Amount highlight box ──────────────────────────────────────────────
    fillRect(doc, 40, y, 515, 52, C.green50);
    strokeRect(doc, 40, y, 515, 52, C.green200, 1);
    doc
      .save()
      .fontSize(9)
      .font("Helvetica")
      .fillColor(C.muted)
      .text("Admission Fee Amount Paid", 0, y + 10, {
        align: "center",
        width: 595,
      })
      .restore();
    doc
      .save()
      .fontSize(26)
      .font("Helvetica-Bold")
      .fillColor(C.success)
      .text(
        `₹${(application.admissionFeeAmount || 0).toLocaleString("en-IN")}`,
        0,
        y + 22,
        {
          align: "center",
          width: 595,
        },
      )
      .restore();
    y += 64;

    // ── SECTION 1: Student Details ─────────────────────────────────────────
    y = sectionHeader(doc, "1. Student Details", y);
    y = fieldRow(doc, y, [
      ["Full Name", application.fullName],
      ["Application No.", application.applicationNumber],
    ]);
    y = fieldRow(doc, y, [
      ["Course Applied For", application.appliedFor],
      ["Category", application.category],
    ]);
    y = fieldRow(doc, y, [
      ["Session", application.session],
      ["Contact No.", application.contactNo],
    ]);

    y += 4;
    hr(doc, y);
    y += 10;

    // ── SECTION 2: Fee Details ─────────────────────────────────────────────
    y = sectionHeader(doc, "2. Fee Details", y);
    y = fieldRow(doc, y, [
      [
        "Fee Amount",
        `₹${(application.admissionFeeAmount || 0).toLocaleString("en-IN")}`,
      ],
      ["Payment Status", "COMPLETED"],
    ]);
    y = fieldRow(doc, y, [
      ["Payment Date", fmtDateTime(application.admissionFeeDate)],
      ["Payment Mode", isOffline ? "Offline / Cash" : "Online (Razorpay)"],
    ]);

    if (!isOffline) {
      y = fieldRow(doc, y, [
        ["Transaction ID", application.admissionTransactionId],
        ["Razorpay Payment ID", application.admissionRazorpayPaymentId],
      ]);
    } else {
      y = fieldRow(doc, y, [
        ["Marked Paid By", application.markedPaidBy],
        ["Note", application.markedPaidNote || "—"],
      ]);
    }

    y += 4;
    hr(doc, y);
    y += 14;

    // ── Declaration / Note box ────────────────────────────────────────────
    fillRect(doc, 40, y, 515, 46, C.amber50);
    strokeRect(doc, 40, y, 515, 46, C.gold, 0.8);
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .fillColor(C.gold)
      .text("IMPORTANT NOTE", 48, y + 6)
      .restore();
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#78350F")
      .text(
        "This receipt confirms payment of the admission fee only. " +
          "Please retain this receipt for your records. " +
          "For any discrepancy, contact the college office with your application number.",
        48,
        y + 18,
        { width: 499 },
      )
      .restore();
    y += 58;

    // ── Signature lines ────────────────────────────────────────────────────
    hr(doc, y + 20, 48, 220, C.text, 0.5);
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(C.muted)
      .text("Student's Signature", 48, y + 24, { width: 172, align: "center" })
      .restore();
    hr(doc, y + 20, 360, 530, C.text, 0.5);
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(C.muted)
      .text("Cashier / Authorized Signatory", 360, y + 24, {
        width: 170,
        align: "center",
      })
      .restore();

    // ── Offline watermark ──────────────────────────────────────────────────
    if (isOffline) {
      doc
        .save()
        .fontSize(54)
        .font("Helvetica-Bold")
        .fillColor("#FDE68A")
        .opacity(0.3)
        .rotate(-45, { origin: [297, 420] })
        .text("OFFLINE PAYMENT", 40, 360, { width: 500, align: "center" })
        .restore();
    }

    drawPageFooter(doc);
    doc.end();
  } catch (error) {
    console.error("Admission Fee Receipt PDF Error:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: "Failed to generate receipt" });
    }
  }
};

module.exports = { generateAdmissionFeeReceipt };
