import { useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-2 rounded-md mb-3">
      {title}
    </h3>
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-1">{children}</div>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800">
      {value !== undefined && value !== null && value !== "" ? (
        String(value)
      ) : (
        <span className="text-gray-300 italic">—</span>
      )}
    </p>
  </div>
);

const DocLink = ({ label, filename }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-600">{label}</span>
    {filename ? (
      <a
        href={`${BASE_URL}/uploads/documents/${filename}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full transition"
      >
        View PDF ↗
      </a>
    ) : (
      <span className="text-xs text-gray-300 italic">Not uploaded</span>
    )}
  </div>
);

const statusStyle = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-yellow-100 text-yellow-700",
  under_review: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const paymentStyle = {
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function ApplicationDetailModal({ application, onClose }) {
  const [imgError, setImgError] = useState(false);

  if (!application) return null;

  const a = application;
  const docs = a.documents || {};

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-indigo-600 rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">
              Application Details
            </h2>
            <p className="text-indigo-200 text-xs mt-0.5">
              #{a.applicationNumber} &nbsp;·&nbsp; Submitted:{" "}
              {formatDate(a.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                statusStyle[a.status] || "bg-gray-100 text-gray-600"
              }`}
            >
              {a.status?.replace("_", " ")}
            </span>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                paymentStyle[a.paymentStatus] || "bg-gray-100 text-gray-600"
              }`}
            >
              Payment: {a.paymentStatus}
            </span>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 text-3xl leading-none ml-2"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* Photo + Application Info */}
          <div className="flex gap-6 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="shrink-0">
              {!imgError && docs.studentPhoto ? (
                <img
                  src={`${BASE_URL}/uploads/photos/${docs.studentPhoto}`}
                  alt={a.fullName}
                  onError={() => setImgError(true)}
                  className="w-28 h-32 object-cover rounded-lg border-2 border-indigo-200 shadow"
                />
              ) : (
                <div className="w-28 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
                  <span className="text-xs text-gray-400 text-center px-2">
                    No Photo
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3">
              <Field label="Full Name" value={a.fullName} />
              <Field label="Applied For (Stream)" value={a.appliedFor} />
              <Field label="Session" value={a.session} />
              <Field label="Reference Number" value={a.referenceNumber} />
              <Field label="Application Number" value={a.applicationNumber} />
              <Field
                label="Disclaimer Agreed"
                value={a.disclaimerAgreed ? "Yes" : "No"}
              />
            </div>
          </div>

          {/* Personal Details */}
          <Section title="Personal Details">
            <Field label="Father's Name" value={a.fatherName} />
            <Field label="Mother's Name" value={a.motherName} />
            <Field label="Date of Birth" value={formatDate(a.dateOfBirth)} />
            <Field label="Gender" value={a.gender} />
            <Field label="Category" value={a.category} />
            <Field label="Religion" value={a.religion} />
            <Field label="Mother Tongue" value={a.motherTongue} />
            <Field label="Blood Group" value={a.bloodGroup} />
            <Field label="Height (cm)" value={a.studentHeight} />
            <Field label="Weight (kg)" value={a.studentWeight} />
            <Field label="Nationality" value={a.nationality} />
            <Field label="Aapar ID" value={a.aaparId} />
          </Section>

          {/* Contact Details */}
          <Section title="Contact Details">
            <Field label="Contact No." value={a.contactNo} />
            <Field label="WhatsApp No." value={a.whatsappNo} />
            <Field label="Guardian Contact No." value={a.guardianContactNo} />
            <Field label="Email Address" value={a.email} />
            <Field label="Aadhar Card No." value={a.aadharCard} />
          </Section>

          {/* Address Details */}
          <Section title="Address Details">
            <div className="col-span-2">
              <Field label="Present Address" value={a.presentAddress} />
            </div>
            <div className="col-span-2">
              <Field label="Permanent Address" value={a.permanentAddress} />
            </div>
          </Section>

          {/* Educational Details */}
          <Section title="Educational Qualification (Class X)">
            <Field label="School Name" value={a.schoolName} />
            <Field label="Board" value={a.board} />
            <Field label="Subject" value={a.subject} />
            <Field label="Year of Passing" value={a.yearOfPassing} />
            <Field label="Marks Obtained" value={a.marksObtained} />
            <Field label="Total Marks" value={a.totalMarks} />
            <Field
              label="Percentage"
              value={a.percentage ? `${a.percentage}%` : null}
            />
            <Field label="Grade" value={a.grade} />
            <Field label="Division" value={a.division} />
          </Section>

          {/* Payment Details */}
          <Section title="Payment Details">
            <Field label="Amount" value={a.amount ? `₹${a.amount}` : null} />
            <Field label="Payment Status" value={a.paymentStatus} />
            <Field label="Transaction ID" value={a.transactionId} />
            <Field label="Payment Date" value={formatDate(a.paymentDate)} />
            <Field label="Razorpay Order ID" value={a.razorpayOrderId} />
            <Field label="Razorpay Payment ID" value={a.razorpayPaymentId} />
          </Section>

          {/* Documents */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-2 rounded-md mb-3">
              Uploaded Documents
            </h3>
            <div className="bg-white border border-gray-100 rounded-lg px-4">
              <DocLink label="10th Marksheet" filename={docs.tenthMarksheet} />
              <DocLink label="10th Admit Card" filename={docs.tenthAdmitCard} />
              <DocLink
                label="Transfer Certificate"
                filename={docs.transferCertificate}
              />
              <DocLink
                label="Character Certificate"
                filename={docs.characterCertificate}
              />
              <DocLink
                label="Migration Certificate"
                filename={docs.migration}
              />
              <DocLink
                label="Caste Certificate"
                filename={docs.casteCertificate}
              />
              <DocLink label="BPL Certificate" filename={docs.bplCertificate} />
              <DocLink
                label="Aadhar Card (Document)"
                filename={docs.aadharCardDoc}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
