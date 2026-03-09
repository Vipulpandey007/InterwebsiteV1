import FormField from "../shared/FormField";
import SectionWrapper from "../shared/SectionWrapper";

export default function AcademicSection({ data, onChange }) {
  return (
    <SectionWrapper title="Educational Qualification (Class X)">
      <FormField
        label="School Name"
        name="schoolName"
        value={data.schoolName}
        onChange={onChange}
        colSpan={2}
        required
      />
      <FormField
        label="Board"
        name="board"
        value={data.board}
        onChange={onChange}
        type="select"
        options={["CBSE", "ICSE", "JAC", "Other"]}
        required
      />
      <FormField
        label="Subject"
        name="subject"
        value={data.subject}
        onChange={onChange}
        required
      />
      <FormField
        label="Year of Passing"
        name="yearOfPassing"
        value={data.yearOfPassing}
        onChange={onChange}
        type="number"
        placeholder="e.g. 2024"
        required
      />
      <FormField
        label="Marks Obtained"
        name="marksObtained"
        value={data.marksObtained}
        onChange={onChange}
        type="number"
        required
      />
      <FormField
        label="Total Marks"
        name="totalMarks"
        value={data.totalMarks}
        onChange={onChange}
        type="number"
        required
      />
      <FormField
        label="Grade"
        name="grade"
        value={data.grade}
        onChange={onChange}
      />
      <FormField
        label="Division"
        name="division"
        value={data.division}
        onChange={onChange}
        type="select"
        options={["First", "Second", "Third"]}
      />
    </SectionWrapper>
  );
}
