import React from "react";

const SettingsModal = ({
  showSettings,
  setShowSettings,
  settingsForm,
  setSettingsForm,
  handleSaveSettings,
  savingSettings,
}) => {
  if (!showSettings) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          maxWidth: 520,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#1E293B",
              margin: 0,
            }}
          >
            ⚙️ Admission Portal Settings
          </h3>
          <button
            onClick={() => setShowSettings(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#64748B",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Academic Session
          </label>
          <input
            type="text"
            value={settingsForm.session}
            onChange={(e) =>
              setSettingsForm((p) => ({ ...p, session: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1.5px solid #E2E8F0",
              borderRadius: 8,
              fontSize: 14,
              boxSizing: "border-box",
            }}
            placeholder="e.g. 2026-27"
          />
        </div>

        <div
          style={{
            marginBottom: 20,
            padding: 16,
            background: "#F8FAFC",
            borderRadius: 10,
            border: "1.5px solid #E2E8F0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1E293B",
                  margin: "0 0 4px",
                }}
              >
                Portal Status
              </p>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                Manually open or close regardless of dates
              </p>
            </div>
            <button
              onClick={() =>
                setSettingsForm((p) => ({ ...p, isOpen: !p.isOpen }))
              }
              style={{
                padding: "8px 20px",
                borderRadius: 20,
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                background: settingsForm.isOpen ? "#DCFCE7" : "#FEE2E2",
                color: settingsForm.isOpen ? "#166534" : "#991B1B",
              }}
            >
              {settingsForm.isOpen ? "🟢 OPEN" : "🔴 CLOSED"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Open Date{" "}
            <span style={{ color: "#94A3B8", fontWeight: 400 }}>
              (optional)
            </span>
          </label>
          <input
            type="datetime-local"
            value={settingsForm.openDate}
            onChange={(e) =>
              setSettingsForm((p) => ({ ...p, openDate: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1.5px solid #E2E8F0",
              borderRadius: 8,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: 11, color: "#94A3B8", margin: "4px 0 0" }}>
            Portal auto-opens at this time
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Application Deadline{" "}
            <span style={{ color: "#DC2626", fontWeight: 400 }}>*</span>
          </label>
          <input
            type="datetime-local"
            value={settingsForm.closeDate}
            onChange={(e) =>
              setSettingsForm((p) => ({ ...p, closeDate: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1.5px solid #E2E8F0",
              borderRadius: 8,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: 11, color: "#94A3B8", margin: "4px 0 0" }}>
            Portal auto-closes after this date & time
          </p>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Message When Closed
          </label>
          <textarea
            value={settingsForm.closedMessage}
            onChange={(e) =>
              setSettingsForm((p) => ({ ...p, closedMessage: e.target.value }))
            }
            rows={3}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1.5px solid #E2E8F0",
              borderRadius: 8,
              fontSize: 14,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setShowSettings(false)}
            style={{
              flex: 1,
              padding: 11,
              border: "1.5px solid #E2E8F0",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: "#fff",
              color: "#374151",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            style={{
              flex: 2,
              padding: 11,
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: savingSettings ? "not-allowed" : "pointer",
              background: savingSettings ? "#A5B4FC" : "#6366F1",
              color: "#fff",
            }}
          >
            {savingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
