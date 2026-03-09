import ReviewSection from "./ReviewSection";
import ReviewField from "./ReviewField";

export default function ReviewAcademicDetails({ formData }) {
  return (
    <ReviewSection title="Educational Qualification (Class X)" icon="🎓">
      <ReviewField label="School Name" value={formData.schoolName} colSpan={2} />
      <ReviewField label="Board" value={formData.board} />
      <ReviewField label="Subject" value={formData.subject} />
      <ReviewField label="Year of Passing" value={formData.yearOfPassing} />
      <ReviewField label="Marks Obtained" value={formData.marksObtained} />
      <ReviewField label="Total Marks" value={formData.totalMarks} />
      <ReviewField
        label="Percentage"
        value={formData.percentage ? `${formData.percentage}%` : ""}
      />
      <ReviewField label="Grade" value={formData.grade} />
      <ReviewField label="Division" value={formData.division} />
    </ReviewSection>
  );
}
