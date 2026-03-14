import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  applicationAPI,
  paymentAPI,
  pdfAPI,
  settingsAPI,
  admissionFeeAPI,
} from "../services/api";
import toast from "react-hot-toast";

// Import modular components & configs
import { STATUS_CONFIG, PAY_CONFIG } from "../constants/studentsConstatnts";
import { StatusPill } from "../components/student/SharedUI";
import OverviewTab from "../components/student/OverviewTab";
import DetailsTab from "../components/student/DetailsTab";
import DocumentsTab from "../components/student/DocumentsTab";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [admissionFeeLoading, setAdmissionFeeLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [portalSettings, setPortalSettings] = useState(null);

  useEffect(() => {
    fetchApplication();
    settingsAPI
      .getSettings()
      .then((res) => setPortalSettings(res.data.data))
      .catch(() => {});
  }, []);

  const fetchApplication = async () => {
    try {
      const res = await applicationAPI.getMyApplications();
      if (res.data.data.applications.length > 0) {
        setApplication(res.data.data.applications[0]);
      }
    } catch {
      toast.error("Failed to fetch application");
    } finally {
      setLoading(false);
    }
  };

  const handlers = {
    handleSubmitApplication: async () => {
      try {
        const res = await applicationAPI.submit(application._id);
        if (res.data.success) {
          toast.success("Application submitted successfully!");
          fetchApplication();
        }
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to submit application",
        );
      }
    },
    handlePayment: async () => {
      if (!application) return;
      setPaymentLoading(true);
      try {
        const orderRes = await paymentAPI.createOrder(application._id);
        const orderData = orderRes.data.data;
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.amount * 100,
          currency: orderData.currency,
          name: "Gossner Intermediate College",
          description: "Application Fee — Session 2026-27",
          order_id: orderData.orderId,
          prefill: {
            name: orderData.name,
            email: orderData.email,
            contact: orderData.mobile,
          },
          theme: { color: "#6366F1" },
          handler: async (response) => {
            try {
              const verRes = await paymentAPI.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                applicationId: application._id,
              });
              if (verRes.data.success) {
                toast.success("🎉 Payment successful!");
                fetchApplication();
              }
            } catch {
              toast.error("Payment verification failed");
            } finally {
              setPaymentLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              toast.error("Payment cancelled");
              setPaymentLoading(false);
            },
          },
        };
        new window.Razorpay(options).open();
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to initiate payment",
        );
        setPaymentLoading(false);
      }
    },
    handleGeneratePDF: async () => {
      setPdfLoading(true);
      try {
        const res = await pdfAPI.generate(application._id);
        if (res.data.success) {
          toast.success("Application form generated!");
          fetchApplication();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to generate PDF");
      } finally {
        setPdfLoading(false);
      }
    },
    handleDownloadPDF: () =>
      window.open(pdfAPI.downloadURL(application._id), "_blank"),

    // ── Admission fee payment (only available after admin approval) ────────
    handleAdmissionFeePayment: async () => {
      if (!application) return;
      setAdmissionFeeLoading(true);
      try {
        const orderRes = await admissionFeeAPI.createOrder(application._id);
        const orderData = orderRes.data.data;
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.amount * 100,
          currency: orderData.currency,
          name: "Gossner Intermediate College",
          description: `Admission Fee — ${application.appliedFor} — Session ${application.session}`,
          order_id: orderData.orderId,
          prefill: {
            name: orderData.name,
            email: orderData.email,
            contact: orderData.mobile,
          },
          theme: { color: "#059669" },
          handler: async (response) => {
            try {
              const verRes = await admissionFeeAPI.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                applicationId: application._id,
              });
              if (verRes.data.success) {
                toast.success("🎉 Admission fee paid successfully!");
                fetchApplication();
              }
            } catch {
              toast.error(
                "Payment verification failed. Please contact the office.",
              );
            } finally {
              setAdmissionFeeLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              toast.error("Payment cancelled");
              setAdmissionFeeLoading(false);
            },
          },
        };
        new window.Razorpay(options).open();
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to initiate payment",
        );
        setAdmissionFeeLoading(false);
      }
    },

    // Download the admission fee receipt PDF (same window.open pattern as admit card)
    handleDownloadFeeReceipt: () =>
      window.open(admissionFeeAPI.receiptURL(application._id), "_blank"),

    // Fully restored Receipt Generator logic
    handleDownloadReceipt: () => {
      const a = application;
      const payDate = a.paymentDate
        ? new Date(a.paymentDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Receipt - ${a.applicationNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1E293B; }
            .page { max-width: 600px; margin: 40px auto; padding: 40px; border: 1px solid #E2E8F0; border-radius: 12px; }
            .header { text-align: center; border-bottom: 2px solid #6366F1; padding-bottom: 20px; margin-bottom: 28px; }
            .header h1 { font-size: 22px; font-weight: 800; color: #6366F1; }
            .header p { font-size: 13px; color: #64748B; margin-top: 4px; }
            .badge { display: inline-block; background: #D1FAE5; color: #065F46; font-size: 13px; font-weight: 700; padding: 5px 16px; border-radius: 20px; margin-top: 10px; }
            .amount-box { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; text-align: center; padding: 20px; margin-bottom: 24px; }
            .amount-box .label { font-size: 12px; color: #6B7280; font-weight: 600; margin-bottom: 4px; }
            .amount-box .value { font-size: 36px; font-weight: 900; color: #166534; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
            .row .key { color: #6B7280; font-weight: 600; }
            .row .val { color: #1E293B; font-weight: 700; text-align: right; max-width: 60%; word-break: break-all; font-family: monospace; }
            .footer { text-align: center; margin-top: 28px; font-size: 11px; color: #94A3B8; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .page { border: none; margin: 0; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <h1>Gossner Intermediate College</h1>
              <p>Ranchi, Jharkhand</p>
              <div class="badge">✓ Payment Successful</div>
            </div>

            <div class="amount-box">
              <div class="label">Amount Paid</div>
              <div class="value">₹${a.amount || 1000}</div>
            </div>

            <div class="row"><span class="key">Receipt For</span><span class="val">${a.fullName || "—"}</span></div>
            <div class="row"><span class="key">Application No.</span><span class="val">${a.applicationNumber || "—"}</span></div>
            <div class="row"><span class="key">Session</span><span class="val">${a.session || "—"}</span></div>
            <div class="row"><span class="key">Course Applied</span><span class="val">${a.appliedFor || "—"}</span></div>
            <div class="row"><span class="key">Transaction ID</span><span class="val">${a.transactionId || "—"}</span></div>
            <div class="row"><span class="key">Razorpay Order ID</span><span class="val">${a.razorpayOrderId || "—"}</span></div>
            <div class="row"><span class="key">Payment Date</span><span class="val">${payDate}</span></div>
            <div class="row"><span class="key">Payment Mode</span><span class="val">Online (Razorpay)</span></div>
            <div class="row"><span class="key">Payment Status</span><span class="val" style="color:#166534">Completed</span></div>

            <div class="footer">
              <p>This is a computer-generated receipt. No signature required.</p>
              <p style="margin-top:4px">Generated on ${new Date().toLocaleString("en-IN")}</p>
            </div>
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
        </html>
      `;

      const w = window.open("", "_blank");
      w.document.write(html);
      w.document.close();
    },
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out");
  };

  const getStepStatus = (step) => {
    if (!application) return "locked";
    const { status, paymentStatus, admitCardGenerated, admissionFeeStatus } =
      application;
    if (step === 1) return status === "draft" ? "active" : "done";
    if (step === 2) {
      if (status === "draft") return "locked";
      return paymentStatus === "completed" ? "done" : "active";
    }
    if (step === 3) {
      if (paymentStatus !== "completed") return "locked";
      return status === "approved" || status === "rejected" ? "done" : "active";
    }
    if (step === 4) {
      if (paymentStatus !== "completed") return "locked";
      return admitCardGenerated ? "done" : "active";
    }
    if (step === 5) {
      if (status !== "approved") return "locked";
      return admissionFeeStatus === "completed" ? "done" : "active";
    }
    return "locked";
  };

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              border: "4px solid #E0E7FF",
              borderTop: "4px solid #6366F1",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#64748B", fontSize: 15, fontWeight: 500 }}>
            Loading your dashboard…
          </p>
        </div>
      </div>
    );

  if (!application)
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        {/* Header for No Application State */}
        <header
          style={{
            background: "#fff",
            borderBottom: "1px solid #E2E8F0",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: "#6366F1",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              GIC
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#1E293B" }}>
              Student Portal
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              border: "1px solid #E2E8F0",
              background: "#fff",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              color: "#64748B",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </header>
        <div
          style={{
            maxWidth: 540,
            margin: "80px auto",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          {portalSettings && !portalSettings.isAccepting ? (
            <>
              <div style={{ fontSize: 64, marginBottom: 24 }}>🔒</div>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#1E293B",
                  marginBottom: 12,
                }}
              >
                Applications Closed
              </h2>
              <p style={{ color: "#64748B", fontSize: 15, marginBottom: 16 }}>
                {portalSettings.closedMessage}
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 64, marginBottom: 24 }}>📋</div>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#1E293B",
                  marginBottom: 12,
                }}
              >
                No Application Yet
              </h2>
              <button
                onClick={() => navigate("/apply")}
                style={{
                  background: "#6366F1",
                  color: "#fff",
                  border: "none",
                  padding: "14px 32px",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Start Application →
              </button>
            </>
          )}
        </div>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F1F5F9",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #E2E8F0",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#6366F1",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            GIC
          </div>
          <div>
            <p
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#1E293B",
                lineHeight: 1,
              }}
            >
              Student Portal
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
              {user?.name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              border: "1px solid #E2E8F0",
              background: "#fff",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              color: "#64748B",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Status Banners ── */}
      {application.status === "rejected" && (
        <div
          style={{
            background: "#FEF2F2",
            borderBottom: "1px solid #FCA5A5",
            padding: "12px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#DC2626", fontWeight: 600, fontSize: 14 }}>
            ❌ Your application has been rejected.
          </p>
        </div>
      )}
      {application.status === "approved" && (
        <div
          style={{
            background: "#ECFDF5",
            borderBottom: "1px solid #6EE7B7",
            padding: "12px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#059669", fontWeight: 600, fontSize: 14 }}>
            🎉 Congratulations! Your application has been approved.
          </p>
        </div>
      )}

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px" }}>
        {/* ── Top summary strip ── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            marginBottom: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>
              Application No.
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#6366F1" }}>
              {application.applicationNumber || "—"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>
              Student Name
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>
              {application.fullName || "—"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>
              Application Status
            </p>
            <StatusPill status={application.status} config={STATUS_CONFIG} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>
              Application Payment Status
            </p>
            <StatusPill
              status={application.paymentStatus}
              config={PAY_CONFIG}
            />
          </div>
        </div>

        {/* ── Tabs Controls ── */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #E2E8F0",
            padding: 4,
            width: "fit-content",
          }}
        >
          {[
            { id: "overview", label: "📋 Overview" },
            { id: "details", label: "👤 My Details" },
            { id: "documents", label: "📎 Documents" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 18px",
                borderRadius: 7,
                border: "none",
                background: activeTab === tab.id ? "#6366F1" : "transparent",
                color: activeTab === tab.id ? "#fff" : "#64748B",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {activeTab === "overview" && (
          <>
            {/* ── Admission Fee Panel — only shown when approved ── */}
            {application.status === "approved" && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  border:
                    application.admissionFeeStatus === "completed"
                      ? "1.5px solid #6EE7B7"
                      : "1.5px solid #FDE68A",
                  padding: "20px 24px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#1E293B",
                        marginBottom: 4,
                      }}
                    >
                      💳 Admission Fee
                    </p>
                    {application.admissionFeeStatus === "completed" ? (
                      <p style={{ fontSize: 13, color: "#059669", margin: 0 }}>
                        Fee of{" "}
                        <strong>
                          ₹
                          {(application.admissionFeeAmount || 0).toLocaleString(
                            "en-IN",
                          )}
                        </strong>{" "}
                        paid
                        {application.markedPaidOffline
                          ? " (offline / cash)"
                          : " via Razorpay"}{" "}
                        on{" "}
                        {application.admissionFeeDate
                          ? new Date(
                              application.admissionFeeDate,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                        . Your enrollment is confirmed.
                      </p>
                    ) : (
                      <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                        Your application is approved. Pay the admission fee to
                        confirm your enrollment.
                        {application.admissionFeeAmount > 0 && (
                          <>
                            {" "}
                            Amount due:{" "}
                            <strong style={{ color: "#1E293B" }}>
                              ₹
                              {application.admissionFeeAmount.toLocaleString(
                                "en-IN",
                              )}
                            </strong>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {application.admissionFeeStatus === "completed" ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: "#DCFCE7",
                          color: "#166534",
                          padding: "6px 16px",
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        ✓ Paid
                      </span>
                      <button
                        onClick={handlers.handleDownloadFeeReceipt}
                        style={{
                          background: "#6366F1",
                          color: "#fff",
                          border: "none",
                          padding: "9px 20px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Download Receipt
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handlers.handleAdmissionFeePayment}
                      disabled={admissionFeeLoading}
                      style={{
                        background: admissionFeeLoading ? "#A7F3D0" : "#059669",
                        color: "#fff",
                        border: "none",
                        padding: "10px 26px",
                        borderRadius: 9,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: admissionFeeLoading ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {admissionFeeLoading
                        ? "Processing…"
                        : "Pay Admission Fee →"}
                    </button>
                  )}
                </div>
              </div>
            )}

            <OverviewTab
              application={application}
              getStepStatus={getStepStatus}
              handlers={handlers}
              loadingStates={{
                paymentLoading,
                pdfLoading,
                admissionFeeLoading,
              }}
            />
          </>
        )}
        {activeTab === "details" && <DetailsTab application={application} />}
        {activeTab === "documents" && (
          <DocumentsTab application={application} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
