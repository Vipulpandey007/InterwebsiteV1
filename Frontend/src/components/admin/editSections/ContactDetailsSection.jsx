import FormField from "../shared/FormField";
import SectionWrapper from "../shared/SectionWrapper";

export default function ContactDetailsSection({ data, onChange }) {
  return (
    <SectionWrapper title="Contact Details">
      <FormField
        label="Contact No."
        name="contactNo"
        value={data.contactNo}
        onChange={onChange}
        placeholder="10-digit number"
        required
      />
      <FormField
        label="WhatsApp No."
        name="whatsappNo"
        value={data.whatsappNo}
        onChange={onChange}
        placeholder="10-digit number"
      />
      <FormField
        label="Guardian Contact No."
        name="guardianContactNo"
        value={data.guardianContactNo}
        onChange={onChange}
        placeholder="10-digit number"
        required
      />
      <FormField
        label="Email Address"
        name="email"
        value={data.email}
        onChange={onChange}
        type="email"
        required
      />
      <FormField
        label="Aadhar Card No."
        name="aadharCard"
        value={data.aadharCard}
        onChange={onChange}
        placeholder="12-digit number"
        required
      />
    </SectionWrapper>
  );
}
