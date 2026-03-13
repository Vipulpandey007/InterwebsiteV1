import React from "react";
import { useNavigate } from "react-router-dom";
import { TimelineStep, StepLine } from "./SharedUi";

const OverviewTab = ({
  application,
  getStepStatus,
  handlers,
  loadingStates,
}) => {
  const navigate = useNavigate();
  const { paymentLoading, pdfLoading } = loadingStates;
  const {
    handleSubmitApplication,
    handlePayment,
    handleGeneratePDF,
    handleDownloadPDF,
    handleDownloadReceipt,
  } = handlers;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
      {/* Progress Timeline Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #E2E8F0",
          padding: "28px 28px 8px",
        }}
      >
        <h3
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "#1E293B",
            marginBottom: 24,
          }}
        >
          Application Progress
        </h3>

        {/* STEP 1: Fill & Submit */}
        <TimelineStep
          num={1}
          title="Fill & Submit Application"
          subtitle={
            ["draft", "submitted"].includes(application.status) &&
            application.paymentStatus !== "completed"
              ? "Complete or edit your application form."
              : `Submitted on ${application.createdAt ? new Date(application.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}`
          }
          status={getStepStatus(1)}
        >
          {application.paymentStatus !== "completed" &&
            application.status !== "approved" &&
            application.status !== "rejected" && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() =>
                    navigate("/apply", {
                      state: { applicationId: application._id, editMode: true },
                    })
                  }
                  style={{
                    background: "#EEF2FF",
                    color: "#6366F1",
                    border: "none",
                    padding: "9px 18px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ✏️ Edit Application
                </button>
                <button
                  onClick={handleSubmitApplication}
                  style={{
                    background: "#6366F1",
                    color: "#fff",
                    border: "none",
                    padding: "9px 18px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px #6366F140",
                  }}
                >
                  📤 Submit Application
                </button>
              </div>
            )}
        </TimelineStep>

        <StepLine done={getStepStatus(1) === "done"} />

        {/* STEP 2: Payment */}
        <TimelineStep
          num={2}
          title="Pay Application Fee"
          subtitle={
            application.paymentStatus === "completed"
              ? `₹${application.amount} paid · Txn: ${application.transactionId || "—"}`
              : `₹${application.amount || 1000} due`
          }
          status={getStepStatus(2)}
        >
          {getStepStatus(2) === "active" && (
            <button
              onClick={handlePayment}
              disabled={paymentLoading}
              style={{
                background: paymentLoading ? "#A5B4FC" : "#6366F1",
                color: "#fff",
                border: "none",
                padding: "10px 22px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: paymentLoading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px #6366F140",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {paymentLoading
                ? "Processing…"
                : `💳 Pay ₹${application.amount || 1000}`}
            </button>
          )}

          {application.paymentStatus === "completed" && (
            <>
              <div
                style={{
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#6B7280",
                      fontWeight: 600,
                      marginBottom: 3,
                    }}
                  >
                    Transaction ID
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "#166534",
                      wordBreak: "break-all",
                    }}
                  >
                    {application.transactionId || "—"}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#6B7280",
                      fontWeight: 600,
                      marginBottom: 3,
                    }}
                  >
                    Amount Paid
                  </p>
                  <p
                    style={{ fontSize: 16, fontWeight: 800, color: "#166534" }}
                  >
                    ₹{application.amount}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#6B7280",
                      fontWeight: 600,
                      marginBottom: 3,
                    }}
                  >
                    Payment Date
                  </p>
                  <p
                    style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}
                  >
                    {application.paymentDate
                      ? new Date(application.paymentDate).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )
                      : "—"}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#6B7280",
                      fontWeight: 600,
                      marginBottom: 3,
                    }}
                  >
                    Mode
                  </p>
                  <p
                    style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}
                  >
                    Online (Razorpay)
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadReceipt}
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#166534",
                  color: "#fff",
                  border: "none",
                  padding: "9px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🧾 Download Receipt
              </button>
            </>
          )}
        </TimelineStep>

        <StepLine done={getStepStatus(2) === "done"} />

        {/* STEP 3: Under Review */}
        <TimelineStep
          num={3}
          title="Application Under Review"
          subtitle={
            application.status === "approved"
              ? "Your application has been approved by the college."
              : application.status === "rejected"
                ? "Your application was not approved. Contact college for details."
                : application.paymentStatus === "completed"
                  ? "Your application is being reviewed by the admissions team."
                  : "This step will be unlocked after payment."
          }
          status={getStepStatus(3)}
        >
          {application.status === "rejected" && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 8,
                padding: "12px 16px",
              }}
            >
              <p style={{ color: "#DC2626", fontSize: 13, fontWeight: 600 }}>
                Contact the college at: admission@gcraninter.org or visit in
                person.
              </p>
            </div>
          )}
        </TimelineStep>

        <StepLine done={getStepStatus(3) === "done"} />

        {/* STEP 4: Download Form */}
        <TimelineStep
          num={4}
          title="Download Application Form"
          subtitle={
            application.paymentStatus !== "completed"
              ? "Available after application approval."
              : application.admitCardGenerated
                ? "Your application form is ready to download."
                : "Click below to generate your application form."
          }
          status={getStepStatus(4)}
        >
          {application.paymentStatus === "completed" && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {application.admitCardGenerated ? (
                <>
                  <button
                    onClick={handleDownloadPDF}
                    style={{
                      background: "#6366F1",
                      color: "#fff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px #6366F140",
                    }}
                  >
                    ⬇️ Download Application Form
                  </button>
                  <button
                    onClick={handleGeneratePDF}
                    disabled={pdfLoading}
                    style={{
                      background: "#F8FAFC",
                      color: "#64748B",
                      border: "1px solid #E2E8F0",
                      padding: "10px 20px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {pdfLoading ? "Regenerating…" : "🔄 Regenerate"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGeneratePDF}
                  disabled={pdfLoading}
                  style={{
                    background: "#6366F1",
                    color: "#fff",
                    border: "none",
                    padding: "10px 22px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: pdfLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px #6366F140",
                    opacity: pdfLoading ? 0.7 : 1,
                  }}
                >
                  {pdfLoading ? "Generating…" : "📄 Generate Application Form"}
                </button>
              )}
            </div>
          )}
        </TimelineStep>
      </div>

      {application.status !== "draft" && (
        <div
          style={{
            background: "#F0FDF4",
            borderRadius: 12,
            border: "1px solid #BBF7D0",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 700,
                color: "#166534",
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              📋 Application Form Summary
            </p>
            <p style={{ color: "#15803D", fontSize: 13 }}>
              Download a PDF copy of your complete application for your records.
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          background: "#EEF2FF",
          borderRadius: 12,
          border: "1px solid #C7D2FE",
          padding: "16px 20px",
        }}
      >
        <p
          style={{
            fontWeight: 700,
            color: "#3730A3",
            fontSize: 14,
            marginBottom: 6,
          }}
        >
          📞 Need Help?
        </p>
        <p style={{ color: "#4338CA", fontSize: 13, lineHeight: 1.6 }}>
          Contact the admissions office at{" "}
          <strong>admission@gcraninter.org</strong> or call the college during
          working hours (9AM–4PM, Mon–Sat).
        </p>
      </div>
    </div>
  );
};

export default OverviewTab;
