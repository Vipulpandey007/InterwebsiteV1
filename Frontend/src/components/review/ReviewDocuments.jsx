const DOC_LABELS = {
  studentPhoto: "Student Photo",
  tenthMarksheet: "10th Marksheet",
  tenthAdmitCard: "10th Admit Card",
  transferCertificate: "Transfer Certificate",
  characterCertificate: "Character Certificate",
  migration: "Migration Certificate",
  casteCertificate: "Caste Certificate",
  bplCertificate: "BPL Certificate",
  aadharCardDoc: "Aadhar Card",
};

const REQUIRED_DOCS = ["studentPhoto", "tenthMarksheet", "aadharCardDoc"];

export default function ReviewDocuments({ files }) {
  return (
    <div className="mb-5 border border-gray-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 bg-blue-600 px-4 py-2.5">
        <span className="text-white text-base">📎</span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Uploaded Documents
        </h3>
      </div>

      {/* Document List */}
      <div className="bg-white divide-y divide-gray-50">
        {Object.entries(DOC_LABELS).map(([key, label]) => {
          const file = files[key];
          const isRequired = REQUIRED_DOCS.includes(key);

          return (
            <div
              key={key}
              className="flex items-center justify-between px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{label}</span>
                {isRequired && (
                  <span className="text-xs text-red-400 font-medium">*</span>
                )}
              </div>

              {file ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-xs text-green-700 font-medium max-w-[180px] truncate">
                    {file.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-gray-300 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="text-xs text-gray-400 italic">
                    Not uploaded
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
