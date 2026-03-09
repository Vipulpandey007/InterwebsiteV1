/**
 * Reusable form field component for the admin edit modal.
 * Supports text, number, select, textarea, and date input types.
 */
export default function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  options = [],
  required = false,
  colSpan = 1,
  placeholder = "",
  disabled = false,
}) {
  const baseInputClass =
    "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-400";

  const renderInput = () => {
    if (type === "select") {
      return (
        <select
          name={name}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          className={baseInputClass}
        >
          <option value="">— Select —</option>
          {options.map((opt) =>
            typeof opt === "string" ? (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ) : (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            )
          )}
        </select>
      );
    }

    if (type === "textarea") {
      return (
        <textarea
          name={name}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          rows={3}
          className={`${baseInputClass} resize-none`}
        />
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        className={baseInputClass}
      />
    );
  };

  return (
    <div className={colSpan === 2 ? "col-span-2" : "col-span-1"}>
      <label className="block text-xs text-gray-500 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {renderInput()}
    </div>
  );
}
