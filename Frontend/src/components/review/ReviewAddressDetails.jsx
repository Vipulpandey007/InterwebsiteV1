import ReviewSection from "./ReviewSection";
import ReviewField from "./ReviewField";

export default function ReviewAddressDetails({ formData }) {
  return (
    <ReviewSection title="Address Details" icon="🏠">
      <ReviewField
        label="Present Address"
        value={formData.presentAddress}
        colSpan={2}
      />
      <ReviewField
        label="Permanent Address"
        value={formData.permanentAddress}
        colSpan={2}
      />
    </ReviewSection>
  );
}
