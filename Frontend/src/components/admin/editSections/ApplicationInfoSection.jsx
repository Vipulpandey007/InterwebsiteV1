import FormField from "../shared/FormField";
import SectionWrapper from "../shared/SectionWrapper";

export default function ApplicationInfoSection({ data, onChange }) {
  return (
    <SectionWrapper title="Application Info">
      <FormField
        label="Applied For (Stream)"
        name="appliedFor"
        value={data.appliedFor}
        onChange={onChange}
        type="select"
        options={["Science", "Commerce", "Arts"]}
        required
      />
      <FormField
        label="Session"
        name="session"
        value={data.session}
        onChange={onChange}
        placeholder="e.g. 2026-2027"
        required
      />
      <FormField
        label="Reference Number"
        name="referenceNumber"
        value={data.referenceNumber}
        onChange={onChange}
      />
    </SectionWrapper>
  );
}
