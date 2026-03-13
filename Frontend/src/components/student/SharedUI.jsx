import React from "react";

export const InfoCard = ({ label, value, mono }) => (
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

export const StatusPill = ({ status, config }) => {
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

export const StepLine = ({ done }) => (
  <div
    style={{
      width: 2,
      height: 32,
      background: done ? "#6366F1" : "#E2E8F0",
      margin: "4px auto",
    }}
  />
);

export const TimelineStep = ({ num, title, subtitle, status, children }) => {
  const isDone = status === "done";
  const isActive = status === "active";
  const isLocked = status === "locked";

  return (
    <div style={{ display: "flex", gap: 16, opacity: isLocked ? 0.45 : 1 }}>
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

export const DocumentChecklist = ({ documents, DOCS }) => (
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
