import React from "react";
import { StatusBadge, PayBadge, Pagination } from "./SharedUI";

const ApplicationTable = ({
  applications,
  tableLoading,
  filterProps,
  paginationProps,
  selectionProps,
  actionProps,
}) => {
  const { debouncedSearch, statusFilter } = filterProps;
  const { page, limit, total, totalPages, setPage, setLimit } = paginationProps;
  const {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    allEligibleSelected,
    eligibleIds,
  } = selectionProps;
  const {
    handleView,
    handleEditClick,
    handleStatusChange,
    handleBulkStatus,
    bulkLoading,
  } = actionProps;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Applications
          {!tableLoading && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({total} total
              {debouncedSearch ? `, filtered by "${debouncedSearch}"` : ""})
            </span>
          )}
        </h3>
        {tableLoading && (
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <div className="animate-spin w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full"></div>
            Loading…
          </div>
        )}
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.length > 0 && (
        <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm font-medium text-indigo-700">
            {selectedIds.length} application{selectedIds.length > 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatus("approved")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
            >
              Approve Selected
            </button>
            <button
              onClick={() => handleBulkStatus("rejected")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
            >
              Reject Selected
            </button>
            <button
              onClick={() => toggleSelectAll(true)}
              className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Card View (< 768px) ── */}
      <div className="block md:hidden divide-y divide-gray-100">
        {applications.length === 0 && !tableLoading ? (
          <div className="px-6 py-16 text-center">
            <p className="text-gray-400 font-medium">No applications found</p>
          </div>
        ) : (
          applications.map((app, idx) => (
            <div
              key={app._id}
              className="px-4 py-4 hover:bg-indigo-50/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {(app.status === "submitted" ||
                    app.status === "under_review") && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(app._id)}
                      onChange={() => toggleSelect(app._id)}
                      style={{
                        width: 16,
                        height: 16,
                        cursor: "pointer",
                        accentColor: "#6366F1",
                      }}
                    />
                  )}
                  <span className="text-xs text-gray-400 w-5">
                    {(page - 1) * limit + idx + 1}.
                  </span>
                  <span className="text-xs font-mono font-semibold text-indigo-600">
                    {app.applicationNumber || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <PayBadge status={app.paymentStatus} />
                  <StatusBadge status={app.status} />
                </div>
              </div>
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-900">
                  {app.fullName || "—"}
                </p>
                <p className="text-xs text-gray-400">
                  {app.appliedFor} · {app.category} · {app.gender}
                </p>
              </div>
              <div className="mb-3">
                <p className="text-xs text-gray-600">{app.contactNo || "—"}</p>
                <p className="text-xs text-gray-400 truncate">
                  {app.email || ""}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {app.createdAt
                    ? new Date(app.createdAt).toLocaleDateString("en-IN")
                    : "—"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleView(app._id)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => handleEditClick(app._id)}
                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md"
                  >
                    ✏️
                  </button>
                  {(app.status === "submitted" ||
                    app.status === "under_review") && (
                    <>
                      <button
                        onClick={() => handleStatusChange(app._id, "approved")}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                      >
                        ✅
                      </button>
                      <button
                        onClick={() => handleStatusChange(app._id, "rejected")}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        ❌
                      </button>
                    </>
                  )}
                  {app.status === "rejected" && (
                    <button
                      onClick={() => handleStatusChange(app._id, "approved")}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                    >
                      ✅
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Desktop Table View (≥ 768px) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allEligibleSelected}
                  onChange={toggleSelectAll}
                  disabled={eligibleIds.length === 0}
                  style={{
                    width: 16,
                    height: 16,
                    cursor: "pointer",
                    accentColor: "#6366F1",
                    opacity: eligibleIds.length === 0 ? 0.4 : 1,
                  }}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                App No.
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Student Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Contact / Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Course
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-gray-50 transition-opacity ${tableLoading ? "opacity-50" : "opacity-100"}`}
          >
            {applications.length === 0 && !tableLoading ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-16 text-center text-gray-400 font-medium"
                >
                  No applications found
                </td>
              </tr>
            ) : (
              applications.map((app, idx) => (
                <tr
                  key={app._id}
                  className={`transition-colors ${selectedIds.includes(app._id) ? "bg-indigo-50" : "hover:bg-indigo-50/30"}`}
                >
                  <td className="px-4 py-3 w-10">
                    {app.status === "submitted" ||
                    app.status === "under_review" ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(app._id)}
                        onChange={() => toggleSelect(app._id)}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                          accentColor: "#6366F1",
                        }}
                      />
                    ) : (
                      <span className="w-4 h-4 block" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {(page - 1) * limit + idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-medium text-indigo-600">
                      {app.applicationNumber || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {app.fullName || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {app.category} · {app.gender}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-700">
                        {app.contactNo || "—"}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">
                        {app.email || ""}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {app.appliedFor || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <PayBadge status={app.paymentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {app.createdAt
                      ? new Date(app.createdAt).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleView(app._id)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md"
                        title="View details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEditClick(app._id)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md"
                        title="Edit application"
                      >
                        ✏️
                      </button>
                      {(app.status === "submitted" ||
                        app.status === "under_review") && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(app._id, "approved")
                            }
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                            title="Approve"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(app._id, "rejected")
                            }
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                            title="Reject"
                          >
                            ❌
                          </button>
                        </>
                      )}
                      {app.status === "rejected" && (
                        <button
                          onClick={() =>
                            handleStatusChange(app._id, "approved")
                          }
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                          title="Re-approve"
                        >
                          ✅
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 || total > 10 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
        />
      ) : null}
    </div>
  );
};

export default ApplicationTable;
