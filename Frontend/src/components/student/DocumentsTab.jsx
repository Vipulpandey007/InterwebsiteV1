import React from "react";
import { useNavigate } from "react-router-dom";
import { DocumentChecklist } from "./SharedUi";
import { DOCS } from "../../constants/studentsConstatnts";

const DocumentsTab = ({ application }) => {
  const navigate = useNavigate();

  return (
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
                  state: { applicationId: application._id, editMode: true },
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

      <DocumentChecklist documents={application.documents} DOCS={DOCS} />

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
          ⚠️ <strong>Required documents (*)</strong> must be uploaded before
          submitting. Optional documents should be uploaded if applicable to
          your category.
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
            if (key === "studentPhoto") return null;
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
  );
};

export default DocumentsTab;
