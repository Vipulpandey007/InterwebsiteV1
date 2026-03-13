import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const home = user ? "/dashboard" : "/";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 60%, #F0FDF4 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480, width: "100%" }}>
        {/* Big 404 */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            lineHeight: 1,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
            userSelect: "none",
          }}
        >
          404
        </div>

        {/* Icon */}
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#1E293B",
            marginBottom: 10,
          }}
        >
          Page Not Found
        </h1>

        {/* Message */}
        <p
          style={{
            color: "#64748B",
            fontSize: 15,
            lineHeight: 1.7,
            marginBottom: 8,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Show the bad URL in dev */}
        <p
          style={{
            color: "#94A3B8",
            fontSize: 12,
            fontFamily: "monospace",
            background: "#F1F5F9",
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 6,
            marginBottom: 32,
          }}
        >
          {location.pathname}
        </p>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "11px 24px",
              border: "1.5px solid #E2E8F0",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: "#fff",
              color: "#374151",
            }}
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate(home)}
            style={{
              padding: "11px 24px",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              background: "#6366F1",
              color: "#fff",
              boxShadow: "0 2px 8px #6366F140",
            }}
          >
            {user ? "Go to Dashboard" : "Go to Home"}
          </button>
        </div>

        {/* College name footer */}
        <p style={{ marginTop: 40, fontSize: 12, color: "#CBD5E1" }}>
          Gossner Intermediate College, Ranchi
        </p>
      </div>
    </div>
  );
}
