/**
 * ReviewField
 * Renders a single label/value pair in the review step.
 * colSpan=2 makes it stretch across the full grid width.
 */
export default function ReviewField({ label, value, colSpan = 1 }) {
  const isEmpty = value === undefined || value === null || value === "";

  return (
    <div className={colSpan === 2 ? "col-span-2" : "col-span-1"}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">
        {isEmpty ? <span className="text-gray-300 italic">Not provided</span> : String(value)}
      </p>
    </div>
  );
}
