import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI, settingsAPI } from "../services/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import ApplicationDetailModal from "../components/admin/ApplicationDetailModal";
import ApplicationEditModal from "../components/admin/ApplicationEditModal";

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  all: {
    label: "All",
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  },
  submitted: {
    label: "Submitted",
    bg: "bg-blue-100",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  under_review: {
    label: "Under Review",
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    dot: "bg-yellow-500",
  },
  approved: {
    label: "Approved",
    bg: "bg-green-100",
    text: "text-green-800",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-100",
    text: "text-red-800",
    dot: "bg-red-500",
  },
  draft: {
    label: "Draft",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
};

const PAY_META = {
  completed: { bg: "bg-green-100", text: "text-green-800", label: "Paid" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
  failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
};

const StatusBadge = ({ status }) => {
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

const PayBadge = ({ status }) => {
  const m = PAY_META[status] || PAY_META.pending;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}
    >
      {m.label}
    </span>
  );
};

// ── Pagination Controls ──────────────────────────────────────────────────────

const Pagination = ({
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

  // Insert ellipsis gaps
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
      {/* Info + rows per page */}
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

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous page"
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
              className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
                p === page
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next page"
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

// ── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color }) => (
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

// ── Main Component ───────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Stats
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalRevenue: 0,
    todayApplications: 0,
  });

  // Table data
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals
  const [viewApp, setViewApp] = useState(null);
  const [editApp, setEditApp] = useState(null);

  // Export
  const [exporting, setExporting] = useState(false);

  // Debounce search
  const debounceTimer = useRef(null);
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  // ── Admission Settings ────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    session: "2026-27",
    isOpen: true,
    openDate: "",
    closeDate: "",
    closedMessage: "Applications for this session are now closed.",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.getSettings();
      const s = res.data.data;
      setSettings(s);
      setSettingsForm({
        session: s.session || "2026-27",
        isOpen: s.isOpen !== false,
        openDate: s.openDate ? s.openDate.slice(0, 16) : "",
        closeDate: s.closeDate ? s.closeDate.slice(0, 16) : "",
        closedMessage:
          s.closedMessage || "Applications for this session are now closed.",
      });
    } catch {
      /* silent */
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await settingsAPI.updateSettings({
        session: settingsForm.session,
        isOpen: settingsForm.isOpen,
        openDate: settingsForm.openDate || null,
        closeDate: settingsForm.closeDate || null,
        closedMessage: settingsForm.closedMessage,
      });
      if (res.data.success) {
        setSettings(res.data.data);
        toast.success("Settings saved!");
        setShowSettings(false);
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    adminAPI
      .getStats()
      .then((r) => {
        if (r.data.success) setStats(r.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchSettings();
  }, []);

  // ── Fetch applications whenever page/limit/filter/search changes ──
  const fetchApplications = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await adminAPI.getAllApplications({
        page,
        limit,
        status: statusFilter,
        search: debouncedSearch,
      });
      if (res.data.success) {
        setApplications(res.data.data.applications);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        navigate("/admin/login");
      } else {
        toast.error("Failed to load applications");
      }
    } finally {
      setTableLoading(false);
    }
  }, [page, limit, statusFilter, debouncedSearch, navigate]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Reset to page 1 when filter changes
  const handleStatusFilter = (s) => {
    setStatusFilter(s);
    setPage(1);
  };

  // ── Status update ──
  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminAPI.updateApplicationStatus(id, newStatus);
      toast.success(`Application ${newStatus}`);
      fetchApplications();
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ── View / Edit ──
  const handleView = async (id) => {
    try {
      const res = await adminAPI.getApplicationById(id);
      if (res.data.success) setViewApp(res.data.data.application);
    } catch {
      toast.error("Failed to load application");
    }
  };

  const handleEditFromDetail = () => {
    setEditApp(viewApp);
    setViewApp(null);
  };

  const handleEditSaved = (updated) => {
    setApplications((prev) =>
      prev.map((a) => (a._id === updated._id ? { ...a, ...updated } : a)),
    );
    setEditApp(null);
    toast.success("Application updated");
  };

  // ── Logout ──
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  // ── Export helpers ──
  const buildExportRow = (app) => ({
    "Application No.": app.applicationNumber || "",
    "Applied For": app.appliedFor || "",
    Session: app.session || "",
    "Full Name": app.fullName || "",
    "Father's Name": app.fatherName || "",
    "Mother's Name": app.motherName || "",
    DOB: app.dateOfBirth
      ? new Date(app.dateOfBirth).toLocaleDateString("en-IN")
      : "",
    Gender: app.gender || "",
    Category: app.category || "",
    Religion: app.religion || "",
    "Mother Tongue": app.motherTongue || "",
    "Blood Group": app.bloodGroup || "",
    Nationality: app.nationality || "",
    "Contact No": app.contactNo || "",
    "WhatsApp No": app.whatsappNo || "",
    "Guardian Contact": app.guardianContactNo || "",
    Email: app.email || "",
    "Aadhar Card": app.aadharCard || "",
    "AAPAR ID": app.aaparId || "",
    "Present Address": app.presentAddress || "",
    "Permanent Address": app.permanentAddress || "",
    "School Name": app.schoolName || "",
    Board: app.board || "",
    Subject: app.subject || "",
    "Marks Obtained": app.marksObtained || "",
    "Total Marks": app.totalMarks || "",
    Percentage: app.percentage || "",
    Grade: app.grade || "",
    Division: app.division || "",
    "Year of Passing": app.yearOfPassing || "",
    Status: app.status || "",
    "Payment Status": app.paymentStatus || "",
    Amount: app.amount || "",
    "Transaction ID": app.transactionId || "",
    "Submitted At": app.createdAt
      ? new Date(app.createdAt).toLocaleDateString("en-IN")
      : "",
  });

  const doExport = async (mode) => {
    setExporting(true);
    try {
      let rows = [];
      if (mode === "filtered") {
        const res = await adminAPI.getAllApplications({
          page: 1,
          limit: 9999,
          status: statusFilter,
          search: debouncedSearch,
        });
        rows = res.data.data.applications.map(buildExportRow);
      } else {
        const res = await adminAPI.getAllApplications({ page: 1, limit: 9999 });
        rows = res.data.data.applications.map(buildExportRow);
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Applications");

      // Summary sheet
      const summary = XLSX.utils.json_to_sheet([
        { Metric: "Total", Value: stats.totalApplications },
        { Metric: "Pending", Value: stats.pendingApplications },
        { Metric: "Approved", Value: stats.approvedApplications },
        { Metric: "Rejected", Value: stats.rejectedApplications },
        { Metric: "Revenue (₹)", Value: stats.totalRevenue },
        { Metric: "Today", Value: stats.todayApplications },
        { Metric: "Exported At", Value: new Date().toLocaleString("en-IN") },
      ]);
      XLSX.utils.book_append_sheet(wb, summary, "Summary");

      const date = new Date().toISOString().split("T")[0];
      XLSX.writeFile(
        wb,
        `GIC_Applications_${mode === "filtered" ? "Filtered" : "All"}_${date}.xlsx`,
      );
      toast.success(`Exported ${rows.length} applications`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  // ── Full page loader ──
  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );

  const adminEmail = JSON.parse(localStorage.getItem("admin") || "{}").email;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GIC</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight">
                Admin Dashboard
              </p>
              <p className="text-xs text-gray-400">
                Gossner Intermediate College
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-gray-500">
              {adminEmail}
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Portal Status Banner ── */}
        {settings && (
          <div
            className={`p-4 rounded-xl border-2 flex items-center justify-between ${settings.isAccepting ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {settings.isAccepting ? "🟢" : "🔴"}
              </span>
              <div>
                <p
                  className={`font-bold text-sm ${settings.isAccepting ? "text-green-800" : "text-red-800"}`}
                >
                  Application Portal is{" "}
                  {settings.isAccepting ? "OPEN" : "CLOSED"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Session: {settings.session}
                  {settings.closeDate &&
                    ` · Deadline: ${new Date(settings.closeDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 underline"
            >
              Edit Settings
            </button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Total"
            value={stats.totalApplications}
            color="bg-blue-50"
            icon={
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          />
          <StatCard
            label="Pending"
            value={stats.pendingApplications}
            color="bg-yellow-50"
            icon={
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            label="Approved"
            value={stats.approvedApplications}
            color="bg-green-50"
            icon={
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            label="Rejected"
            value={stats.rejectedApplications}
            color="bg-red-50"
            icon={
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            label="Revenue"
            value={`₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`}
            color="bg-purple-50"
            icon={
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            label="Today"
            value={stats.todayApplications}
            color="bg-indigo-50"
            icon={
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
          />
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => handleStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <input
                  type="text"
                  placeholder="Search name, email, app no…"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg
                  className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => doExport("filtered")}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-60 transition-colors whitespace-nowrap"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Filtered
              </button>
              <button
                onClick={() => doExport("all")}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60 transition-colors whitespace-nowrap"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export All
              </button>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
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

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    App No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact / Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y divide-gray-50 transition-opacity ${tableLoading ? "opacity-50" : "opacity-100"}`}
              >
                {applications.length === 0 && !tableLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <svg
                        className="w-12 h-12 text-gray-300 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-gray-400 font-medium">
                        No applications found
                      </p>
                      {(debouncedSearch || statusFilter !== "all") && (
                        <p className="text-gray-400 text-sm mt-1">
                          Try clearing your search or filter
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  applications.map((app, idx) => (
                    <tr
                      key={app._id}
                      className="hover:bg-indigo-50/30 transition-colors"
                    >
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
                          {/* View */}
                          <button
                            onClick={() => handleView(app._id)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="View details"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          {/* Edit */}
                          <button
                            onClick={async () => {
                              try {
                                const res = await adminAPI.getApplicationById(
                                  app._id,
                                );
                                if (res.data.success)
                                  setEditApp(res.data.data.application);
                              } catch {
                                toast.error("Failed to load application");
                              }
                            }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Edit application"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          {/* Approve */}
                          {(app.status === "submitted" ||
                            app.status === "under_review") && (
                            <button
                              onClick={() =>
                                handleStatusChange(app._id, "approved")
                              }
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Approve"
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                          )}
                          {/* Reject */}
                          {(app.status === "submitted" ||
                            app.status === "under_review") && (
                            <button
                              onClick={() =>
                                handleStatusChange(app._id, "rejected")
                              }
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Reject"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
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
      </div>

      {/* ── Modals ── */}
      {viewApp && (
        <ApplicationDetailModal
          application={viewApp}
          onClose={() => setViewApp(null)}
          onEdit={handleEditFromDetail}
        />
      )}
      {editApp && (
        <ApplicationEditModal
          application={editApp}
          onClose={() => setEditApp(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 32,
              maxWidth: 520,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#1E293B",
                  margin: 0,
                }}
              >
                ⚙️ Admission Portal Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#64748B",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Academic Session
              </label>
              <input
                type="text"
                value={settingsForm.session}
                onChange={(e) =>
                  setSettingsForm((p) => ({ ...p, session: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
                placeholder="e.g. 2026-27"
              />
            </div>

            <div
              style={{
                marginBottom: 20,
                padding: 16,
                background: "#F8FAFC",
                borderRadius: 10,
                border: "1.5px solid #E2E8F0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#1E293B",
                      margin: "0 0 4px",
                    }}
                  >
                    Portal Status
                  </p>
                  <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                    Manually open or close regardless of dates
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettingsForm((p) => ({ ...p, isOpen: !p.isOpen }))
                  }
                  style={{
                    padding: "8px 20px",
                    borderRadius: 20,
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    background: settingsForm.isOpen ? "#DCFCE7" : "#FEE2E2",
                    color: settingsForm.isOpen ? "#166534" : "#991B1B",
                  }}
                >
                  {settingsForm.isOpen ? "🟢 OPEN" : "🔴 CLOSED"}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Open Date{" "}
                <span style={{ color: "#94A3B8", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <input
                type="datetime-local"
                value={settingsForm.openDate}
                onChange={(e) =>
                  setSettingsForm((p) => ({ ...p, openDate: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "4px 0 0" }}>
                Portal auto-opens at this time
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Application Deadline{" "}
                <span style={{ color: "#DC2626", fontWeight: 400 }}>*</span>
              </label>
              <input
                type="datetime-local"
                value={settingsForm.closeDate}
                onChange={(e) =>
                  setSettingsForm((p) => ({ ...p, closeDate: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "4px 0 0" }}>
                Portal auto-closes after this date & time
              </p>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Message When Closed
              </label>
              <textarea
                value={settingsForm.closedMessage}
                onChange={(e) =>
                  setSettingsForm((p) => ({
                    ...p,
                    closedMessage: e.target.value,
                  }))
                }
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 8,
                  fontSize: 14,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  flex: 1,
                  padding: 11,
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "#fff",
                  color: "#374151",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                style={{
                  flex: 2,
                  padding: 11,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: savingSettings ? "not-allowed" : "pointer",
                  background: savingSettings ? "#A5B4FC" : "#6366F1",
                  color: "#fff",
                }}
              >
                {savingSettings ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
