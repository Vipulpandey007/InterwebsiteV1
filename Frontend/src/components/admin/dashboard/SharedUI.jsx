import React from "react";
import { STATUS_META, PAY_META } from "../../../constants/adminConstants";

export const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`}></span>
      {m.label}
    </span>
  );
};

export const PayBadge = ({ status }) => {
  const m = PAY_META[status] || PAY_META.pending;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}
    >
      {m.label}
    </span>
  );
};

export const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div
      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export const Pagination = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}) => {
  const pages = [];
  const delta = 2;
  const left = page - delta;
  const right = page + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    }
  }

  const withGaps = [];
  let prev = 0;
  for (const p of pages) {
    if (prev && p - prev > 1) withGaps.push("...");
    withGaps.push(p);
    prev = p;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold">
            {start}–{end}
          </span>{" "}
          of <span className="font-semibold">{total}</span> applications
        </span>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Rows:</label>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        {withGaps.map((p, i) =>
          p === "..." ? (
            <span key={`gap-${i}`} className="px-2 text-gray-400 select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${p === page ? "bg-indigo-600 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
