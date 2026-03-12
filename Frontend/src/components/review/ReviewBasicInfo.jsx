import ReviewSection from "./ReviewSection";
import ReviewField from "./ReviewField";

export default function ReviewBasicInfo({ formData }) {
  return (
    <ReviewSection title="Basic Information" icon="📋">
      <ReviewField label="Applied For (Stream)" value={formData.appliedFor} />
      <ReviewField label="Session" value={formData.session} />
      {/* <ReviewField label="Reference Number" value={formData.referenceNumber} /> */}
    </ReviewSection>
  );
}
