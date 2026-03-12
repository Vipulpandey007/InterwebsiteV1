import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { applicationAPI, paymentAPI, pdfAPI } from "../services/api";
import toast from "react-hot-toast";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: { label: "Draft", color: "#6B7280", bg: "#F3F4F6", icon: "✏️" },
  submitted: {
    label: "Submitted",
    color: "#2563EB",
    bg: "#EFF6FF",
    icon: "📤",
  },
  under_review: {
    label: "Under Review",
    color: "#D97706",
    bg: "#FFFBEB",
    icon: "🔍",
  },
  approved: { label: "Approved", color: "#059669", bg: "#ECFDF5", icon: "✅" },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2", icon: "❌" },
};

const PAY_CONFIG = {
  pending: { label: "Pending", color: "#D97706", bg: "#FFFBEB" },
  completed: { label: "Paid", color: "#059669", bg: "#ECFDF5" },
  failed: { label: "Failed", color: "#DC2626", bg: "#FEF2F2" },
};

// ─── Small reusable components ────────────────────────────────────────────────
const InfoCard = ({ label, value, mono }) => (
  <div
    style={{
      background: "#F8FAFC",
      border: "1px solid #E2E8F0",
      borderRadius: 10,
      padding: "14px 16px",
    }}
  >
    <p
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 4,
      }}
    >
      {label}
    </p>
    <p
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: "#1E293B",
        fontFamily: mono ? "monospace" : "inherit",
        wordBreak: "break-all",
      }}
    >
      {value || "—"}
    </p>
  </div>
);

const StatusPill = ({ status, config }) => {
  const c = config[status] || config[Object.keys(config)[0]];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: c.bg,
        color: c.color,
        border: `1.5px solid ${c.color}33`,
        borderRadius: 999,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: c.color,
          flexShrink: 0,
        }}
      ></span>
      {c.label}
    </span>
  );
};

const StepLine = ({ done }) => (
  <div
    style={{
      width: 2,
      height: 32,
      background: done ? "#6366F1" : "#E2E8F0",
      margin: "4px auto",
    }}
  />
);

// ─── Timeline Step ────────────────────────────────────────────────────────────
const TimelineStep = ({ num, title, subtitle, status, children }) => {
  const isDone = status === "done";
  const isActive = status === "active";
  const isLocked = status === "locked";

  return (
    <div style={{ display: "flex", gap: 16, opacity: isLocked ? 0.45 : 1 }}>
      {/* Circle */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: isDone ? "#6366F1" : isActive ? "#fff" : "#F1F5F9",
            border: `2px solid ${isDone ? "#6366F1" : isActive ? "#6366F1" : "#E2E8F0"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isDone ? 16 : 14,
            fontWeight: 700,
            color: isDone ? "#fff" : isActive ? "#6366F1" : "#94A3B8",
            boxShadow: isActive ? "0 0 0 4px #6366F120" : "none",
            transition: "all 0.3s",
          }}
        >
          {isDone ? "✓" : num}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: 28 }}>
        <div style={{ marginBottom: children ? 16 : 0 }}>
          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1E293B",
              marginBottom: 2,
            }}
          >
            {title}
          </p>
          {subtitle && (
            <p style={{ fontSize: 13, color: "#64748B" }}>{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── Document checklist ───────────────────────────────────────────────────────
const DOCS = [
  { key: "studentPhoto", label: "Passport Photo", required: true },
  { key: "tenthMarksheet", label: "10th Marksheet", required: true },
  { key: "tenthAdmitCard", label: "10th Admit Card", required: true },
  { key: "transferCertificate", label: "Transfer Certificate", required: true },
  {
    key: "characterCertificate",
    label: "Character Certificate",
    required: true,
  },
  { key: "migration", label: "Migration Certificate", required: false },
  { key: "casteCertificate", label: "Caste Certificate", required: false },
  { key: "bplCertificate", label: "BPL Certificate", required: false },
  { key: "aadharCardDoc", label: "Aadhar Card Copy", required: false },
];

const DocumentChecklist = ({ documents }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: 8,
    }}
  >
    {DOCS.map(({ key, label, required }) => {
      const uploaded = documents?.[key];
      return (
        <div
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 8,
            background: uploaded ? "#F0FDF4" : required ? "#FFF7ED" : "#F8FAFC",
            border: `1px solid ${uploaded ? "#BBF7D0" : required ? "#FED7AA" : "#E2E8F0"}`,
          }}
        >
          <span style={{ fontSize: 14 }}>
            {uploaded ? "✅" : required ? "⚠️" : "○"}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: uploaded ? "#166534" : required ? "#92400E" : "#64748B",
            }}
          >
            {label}
            {required && !uploaded ? " *" : ""}
          </span>
        </div>
      );
    })}
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchApplication();
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

  const handleSubmitApplication = async () => {
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
  };

  const handlePayment = async () => {
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
      toast.error(err.response?.data?.message || "Failed to initiate payment");
      setPaymentLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
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
  };

  const handleDownloadPDF = () => {
    window.open(pdfAPI.downloadURL(application._id), "_blank");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out");
  };

  // ── Derive step statuses ──
  const getStepStatus = (step) => {
    if (!application) return "locked";
    const { status, paymentStatus, admitCardGenerated } = application;

    if (step === 1) {
      if (status === "draft") return "active";
      return "done";
    }
    if (step === 2) {
      if (status === "draft") return "locked";
      if (paymentStatus === "completed") return "done";
      return "active";
    }
    if (step === 3) {
      if (paymentStatus !== "completed") return "locked";
      if (status === "approved" || status === "rejected") return "done";
      return "active";
    }
    if (step === 4) {
      // PDF available after payment — no admin approval required
      if (paymentStatus !== "completed") return "locked";
      if (admitCardGenerated) return "done";
      return "active";
    }
    return "locked";
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
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
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#64748B", fontSize: 15, fontWeight: 500 }}>
            Loading your dashboard…
          </p>
        </div>
      </div>
    );

  // ─── No Application ────────────────────────────────────────────────────────
  if (!application)
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        {/* Header */}
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
          <p
            style={{
              color: "#64748B",
              fontSize: 15,
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            Begin your admission journey at Gossner Intermediate College. Fill
            the application form to get started.
          </p>
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
              boxShadow: "0 4px 14px #6366F140",
            }}
          >
            Start Application →
          </button>
        </div>
      </div>
    );

  // ─── Main Dashboard ────────────────────────────────────────────────────────
  const s = STATUS_CONFIG[application.status] || STATUS_CONFIG.draft;
  const ps = PAY_CONFIG[application.paymentStatus] || PAY_CONFIG.pending;

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
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
              Gossner Intermediate College
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              textAlign: "right",
              display: window.innerWidth > 480 ? "block" : "none",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
              {user?.name}
            </p>
            <p style={{ fontSize: 11, color: "#94A3B8" }}>{user?.mobile}</p>
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

      {/* ── Status Banner ── */}
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
            ❌ Your application has been rejected. Please contact the college
            for more information.
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
            🎉 Congratulations! Your application has been approved. Please
            download your application form below.
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
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Application No.
            </p>
            <p
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#6366F1",
                fontFamily: "monospace",
              }}
            >
              {application.applicationNumber || "—"}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Student Name
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>
              {application.fullName || "—"}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Course Applied
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>
              {application.appliedFor || "—"}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Application Status
            </p>
            <StatusPill status={application.status} config={STATUS_CONFIG} />
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Payment Status
            </p>
            <StatusPill
              status={application.paymentStatus}
              config={PAY_CONFIG}
            />
          </div>
        </div>

        {/* ── Tabs ── */}
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
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════ */}
        {/* TAB: OVERVIEW — Application progress timeline   */}
        {/* ════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
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
                            state: {
                              applicationId: application._id,
                              editMode: true,
                            },
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
                    {paymentLoading ? (
                      <>
                        <span
                          style={{
                            width: 16,
                            height: 16,
                            border: "2px solid #ffffff60",
                            borderTop: "2px solid #fff",
                            borderRadius: "50%",
                            display: "inline-block",
                            animation: "spin 0.7s linear infinite",
                          }}
                        />
                        Processing…
                      </>
                    ) : (
                      `💳 Pay ₹${application.amount || 1000}`
                    )}
                  </button>
                )}

                {/* Payment receipt */}
                {application.paymentStatus === "completed" && (
                  <div
                    style={{
                      background: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: 10,
                      padding: "14px 16px",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px, 1fr))",
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
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#166534",
                        }}
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
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#166534",
                        }}
                      >
                        {application.paymentDate
                          ? new Date(
                              application.paymentDate,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
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
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#166534",
                        }}
                      >
                        Online (Razorpay)
                      </p>
                    </div>
                  </div>
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
                    <p
                      style={{
                        color: "#DC2626",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Contact the college at: admission@gcraninter.org or visit
                      in person.
                    </p>
                  </div>
                )}
              </TimelineStep>

              <StepLine done={getStepStatus(3) === "done"} />

              {/* STEP 4: Download Admit Card */}
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
                        {pdfLoading
                          ? "Generating…"
                          : "📄 Generate Application Form"}
                      </button>
                    )}
                  </div>
                )}
              </TimelineStep>
            </div>

            {/* Help Card */}
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
                <strong>admission@gcraninter.org</strong> or call the college
                during working hours (9AM–4PM, Mon–Sat).
              </p>
            </div>
          </div>
        )}

        {/* ════════════════════════ */}
        {/* TAB: MY DETAILS         */}
        {/* ════════════════════════ */}
        {activeTab === "details" && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #E2E8F0",
              padding: "28px",
            }}
          >
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#1E293B",
                marginBottom: 20,
              }}
            >
              Application Details
            </h3>

            {/* Personal */}
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Personal Information
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <InfoCard label="Full Name" value={application.fullName} />
              <InfoCard label="Father's Name" value={application.fatherName} />
              <InfoCard label="Mother's Name" value={application.motherName} />
              <InfoCard
                label="Date of Birth"
                value={
                  application.dateOfBirth
                    ? new Date(application.dateOfBirth).toLocaleDateString(
                        "en-IN",
                      )
                    : "—"
                }
              />
              <InfoCard label="Gender" value={application.gender} />
              <InfoCard label="Category" value={application.category} />
              <InfoCard label="Religion" value={application.religion} />
              <InfoCard label="Nationality" value={application.nationality} />
              <InfoCard label="Blood Group" value={application.bloodGroup} />
              <InfoCard
                label="Mother Tongue"
                value={application.motherTongue}
              />
              <InfoCard
                label="Aadhar No."
                value={application.aadharCard}
                mono
              />
              <InfoCard label="AAPAR ID" value={application.aaparId} mono />
            </div>

            {/* Contact */}
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Contact Information
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <InfoCard label="Contact No." value={application.contactNo} />
              <InfoCard label="WhatsApp No." value={application.whatsappNo} />
              <InfoCard
                label="Guardian Contact"
                value={application.guardianContactNo}
              />
              <InfoCard label="Email" value={application.email} />
            </div>

            {/* Address */}
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Address
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <InfoCard
                label="Present Address"
                value={application.presentAddress}
              />
              <InfoCard
                label="Permanent Address"
                value={application.permanentAddress}
              />
            </div>

            {/* Academic */}
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Academic Details
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
              }}
            >
              <InfoCard label="School Name" value={application.schoolName} />
              <InfoCard label="Board" value={application.board} />
              <InfoCard label="Subject" value={application.subject} />
              <InfoCard
                label="Marks Obtained"
                value={application.marksObtained}
              />
              <InfoCard label="Total Marks" value={application.totalMarks} />
              <InfoCard
                label="Percentage"
                value={
                  application.percentage ? `${application.percentage}%` : "—"
                }
              />
              <InfoCard label="Grade" value={application.grade} />
              <InfoCard label="Division" value={application.division} />
              <InfoCard
                label="Year of Passing"
                value={application.yearOfPassing}
              />
            </div>
          </div>
        )}

        {/* ════════════════════════ */}
        {/* TAB: DOCUMENTS          */}
        {/* ════════════════════════ */}
        {activeTab === "documents" && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #E2E8F0",
              padding: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1E293B" }}>
                Uploaded Documents
              </h3>
              {application.paymentStatus !== "completed" &&
                application.status !== "approved" &&
                application.status !== "rejected" && (
                  <button
                    onClick={() =>
                      navigate("/apply", {
                        state: {
                          applicationId: application._id,
                          editMode: true,
                        },
                      })
                    }
                    style={{
                      background: "#EEF2FF",
                      color: "#6366F1",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✏️ Edit Documents
                  </button>
                )}
            </div>

            <DocumentChecklist documents={application.documents} />

            <div
              style={{
                marginTop: 20,
                padding: "12px 16px",
                background: "#FFF7ED",
                border: "1px solid #FED7AA",
                borderRadius: 8,
              }}
            >
              <p style={{ fontSize: 12, color: "#92400E", fontWeight: 500 }}>
                ⚠️ <strong>Required documents (*)</strong> must be uploaded
                before submitting. Optional documents should be uploaded if
                applicable to your category.
              </p>
            </div>

            {/* Individual doc links */}
            <div style={{ marginTop: 20 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 12,
                }}
              >
                View Uploaded Files
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DOCS.map(({ key, label }) => {
                  const filename = application.documents?.[key];
                  if (!filename) return null;
                  return (
                    <a
                      key={key}
                      href={`http://localhost:5000/uploads/documents/${filename}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#F0FDF4",
                        color: "#166534",
                        border: "1px solid #BBF7D0",
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      📄 {label}
                    </a>
                  );
                })}
                {/* Photo */}
                {application.documents?.studentPhoto && (
                  <a
                    href={`http://localhost:5000/uploads/photos/${application.documents.studentPhoto}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#EFF6FF",
                      color: "#1D4ED8",
                      border: "1px solid #BFDBFE",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    🖼️ Passport Photo
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
