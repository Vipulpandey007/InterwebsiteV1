export const STATUS_CONFIG = {
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

export const PAY_CONFIG = {
  pending: { label: "Pending", color: "#D97706", bg: "#FFFBEB" },
  completed: { label: "Paid", color: "#059669", bg: "#ECFDF5" },
  failed: { label: "Failed", color: "#DC2626", bg: "#FEF2F2" },
};

export const DOCS = [
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
