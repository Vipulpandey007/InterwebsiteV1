import FormField from "../shared/FormField";
import SectionWrapper from "../shared/SectionWrapper";

export default function AddressSection({ data, onChange }) {
  return (
    <SectionWrapper title="Address Details">
      <FormField
        label="Present Address"
        name="presentAddress"
        value={data.presentAddress}
        onChange={onChange}
        type="textarea"
        colSpan={2}
        required
      />
      <FormField
        label="Permanent Address"
        name="permanentAddress"
        value={data.permanentAddress}
        onChange={onChange}
        type="textarea"
        colSpan={2}
        required
      />
    </SectionWrapper>
  );
}
