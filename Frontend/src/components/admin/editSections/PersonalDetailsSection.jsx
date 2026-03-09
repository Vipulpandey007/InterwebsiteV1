import FormField from "../shared/FormField";
import SectionWrapper from "../shared/SectionWrapper";

export default function PersonalDetailsSection({ data, onChange }) {
  return (
    <SectionWrapper title="Personal Details">
      <FormField
        label="Full Name"
        name="fullName"
        value={data.fullName}
        onChange={onChange}
        required
      />
      <FormField
        label="Father's Name"
        name="fatherName"
        value={data.fatherName}
        onChange={onChange}
        required
      />
      <FormField
        label="Mother's Name"
        name="motherName"
        value={data.motherName}
        onChange={onChange}
        required
      />
      <FormField
        label="Date of Birth"
        name="dateOfBirth"
        value={data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : ""}
        onChange={onChange}
        type="date"
        required
      />
      <FormField
        label="Gender"
        name="gender"
        value={data.gender}
        onChange={onChange}
        type="select"
        options={["Male", "Female", "Other"]}
        required
      />
      <FormField
        label="Category"
        name="category"
        value={data.category}
        onChange={onChange}
        type="select"
        options={["General", "OBC", "SC", "ST", "EWS"]}
        required
      />
      <FormField
        label="Religion"
        name="religion"
        value={data.religion}
        onChange={onChange}
        required
      />
      <FormField
        label="Mother Tongue"
        name="motherTongue"
        value={data.motherTongue}
        onChange={onChange}
        required
      />
      <FormField
        label="Blood Group"
        name="bloodGroup"
        value={data.bloodGroup}
        onChange={onChange}
        type="select"
        options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
      />
      <FormField
        label="Height (cm)"
        name="studentHeight"
        value={data.studentHeight}
        onChange={onChange}
        type="number"
        required
      />
      <FormField
        label="Weight (kg)"
        name="studentWeight"
        value={data.studentWeight}
        onChange={onChange}
        type="number"
        required
      />
      <FormField
        label="Nationality"
        name="nationality"
        value={data.nationality}
        onChange={onChange}
        required
      />
      <FormField
        label="Aapar ID"
        name="aaparId"
        value={data.aaparId}
        onChange={onChange}
      />
    </SectionWrapper>
  );
}
