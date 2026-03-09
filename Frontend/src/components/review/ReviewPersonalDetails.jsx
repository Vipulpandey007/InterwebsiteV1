import ReviewSection from "./ReviewSection";
import ReviewField from "./ReviewField";

export default function ReviewPersonalDetails({ formData }) {
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";

  return (
    <ReviewSection title="Personal Details" icon="👤">
      <ReviewField label="Full Name" value={formData.fullName} />
      <ReviewField label="Date of Birth" value={formatDate(formData.dateOfBirth)} />
      <ReviewField label="Father's Name" value={formData.fatherName} />
      <ReviewField label="Mother's Name" value={formData.motherName} />
      <ReviewField label="Gender" value={formData.gender} />
      <ReviewField label="Category" value={formData.category} />
      <ReviewField label="Religion" value={formData.religion} />
      <ReviewField label="Mother Tongue" value={formData.motherTongue} />
      <ReviewField label="Blood Group" value={formData.bloodGroup} />
      <ReviewField label="Nationality" value={formData.nationality} />
      <ReviewField label="Height (cm)" value={formData.studentHeight} />
      <ReviewField label="Weight (kg)" value={formData.studentWeight} />
      <ReviewField label="Contact No." value={formData.contactNo} />
      <ReviewField label="WhatsApp No." value={formData.whatsappNo} />
      <ReviewField label="Guardian Contact No." value={formData.guardianContactNo} />
      <ReviewField label="Email Address" value={formData.email} />
      <ReviewField label="Aadhar Card No." value={formData.aadharCard} />
      <ReviewField label="Aapar ID" value={formData.aaparId} />
    </ReviewSection>
  );
}
