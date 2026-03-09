/**
 * Reusable section wrapper for grouping form fields in the edit modal.
 */
export default function SectionWrapper({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-2 rounded-md mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-1">{children}</div>
    </div>
  );
}
