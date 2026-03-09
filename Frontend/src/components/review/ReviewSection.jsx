/**
 * ReviewSection
 * Wraps a group of ReviewField components under a titled section header.
 */
export default function ReviewSection({ title, icon, children }) {
  return (
    <div className="mb-5 border border-gray-100 rounded-xl overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-2 bg-blue-600 px-4 py-2.5">
        {icon && <span className="text-white text-base">{icon}</span>}
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          {title}
        </h3>
      </div>
      {/* Fields Grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4 bg-white">
        {children}
      </div>
    </div>
  );
}
