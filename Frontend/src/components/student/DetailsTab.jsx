import React from "react";
import { InfoCard } from "./SharedUi";

const DetailsTab = ({ application }) => {
  return (
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
              ? new Date(application.dateOfBirth).toLocaleDateString("en-IN")
              : "—"
          }
        />
        <InfoCard label="Gender" value={application.gender} />
        <InfoCard label="Category" value={application.category} />
        <InfoCard label="Religion" value={application.religion} />
        <InfoCard label="Nationality" value={application.nationality} />
        <InfoCard label="Blood Group" value={application.bloodGroup} />
        <InfoCard label="Mother Tongue" value={application.motherTongue} />
        <InfoCard label="Aadhar No." value={application.aadharCard} mono />
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
        <InfoCard label="Present Address" value={application.presentAddress} />
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
        <InfoCard label="Marks Obtained" value={application.marksObtained} />
        <InfoCard label="Total Marks" value={application.totalMarks} />
        <InfoCard
          label="Percentage"
          value={application.percentage ? `${application.percentage}%` : "—"}
        />
        <InfoCard label="Grade" value={application.grade} />
        <InfoCard label="Division" value={application.division} />
        <InfoCard label="Year of Passing" value={application.yearOfPassing} />
      </div>
    </div>
  );
};

export default DetailsTab;
