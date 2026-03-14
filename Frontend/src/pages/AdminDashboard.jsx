import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI, settingsAPI, admissionFeeAPI } from "../services/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import ApplicationDetailModal from "../components/admin/ApplicationDetailModal";
import ApplicationEditModal from "../components/admin/ApplicationEditModal";
import { STATUS_META } from "../constants/adminConstants";
import { StatCard } from "../components/admin/dashboard/SharedUI";
import SettingsModal from "../components/admin/dashboard/SettingsModal";
import ApplicationTable from "../components/admin/dashboard/ApplicationTable";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Active tab: "applications" | "fee"
  const [activeTab, setActiveTab] = useState("applications");

  // State
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalRevenue: 0,
    todayApplications: 0,
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals & Export
  const [viewApp, setViewApp] = useState(null);
  const [editApp, setEditApp] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    session: "2026-27",
    isOpen: true,
    openDate: "",
    closeDate: "",
    closedMessage: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // ── Fee Management state ──────────────────────────────────────────────────
  const [feeStats, setFeeStats] = useState(null);
  const [feeList, setFeeList] = useState([]);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeTotal, setFeeTotal] = useState(0);
  const [feeTotalPages, setFeeTotalPages] = useState(1);
  const [feePage, setFeePage] = useState(1);
  const [feeStatusFilter, setFeeStatusFilter] = useState("all");
  const [feeCourseFilter, setFeeCourseFilter] = useState("all");
  const [feeSearch, setFeeSearch] = useState("");
  const [feeDebouncedSearch, setFeeDebouncedSearch] = useState("");
  const [markingOffline, setMarkingOffline] = useState(null); // applicationId being marked
  const [offlineNote, setOfflineNote] = useState("");
  const [feeExporting, setFeeExporting] = useState(false);

  const debounceTimer = useRef(null);
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

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
        admissionFees: s.admissionFees || [],
      });
    } catch {
      /* silent */
    }
  };

  const fetchFeeStats = async () => {
    try {
      const res = await admissionFeeAPI.getFeeStats();
      if (res.data.success) setFeeStats(res.data.data);
    } catch {
      /* silent */
    }
  };

  const fetchFeeList = useCallback(async () => {
    setFeeLoading(true);
    try {
      const res = await admissionFeeAPI.getFeeList({
        page: feePage,
        limit: 20,
        feeStatus: feeStatusFilter,
        course: feeCourseFilter,
        search: feeDebouncedSearch,
      });
      if (res.data.success) {
        setFeeList(res.data.data.applications);
        setFeeTotal(res.data.total);
        setFeeTotalPages(res.data.totalPages);
      }
    } catch {
      toast.error("Failed to load fee list");
    } finally {
      setFeeLoading(false);
    }
  }, [feePage, feeStatusFilter, feeCourseFilter, feeDebouncedSearch]);

  const handleMarkOffline = async (appId) => {
    setMarkingOffline(appId);
  };

  const confirmMarkOffline = async (appId) => {
    try {
      await admissionFeeAPI.markOfflinePaid(appId, offlineNote);
      toast.success("Marked as paid (offline)");
      setMarkingOffline(null);
      setOfflineNote("");
      fetchFeeList();
      fetchFeeStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as paid");
    }
  };

  const exportFeeExcel = async () => {
    setFeeExporting(true);
    try {
      const res = await admissionFeeAPI.getFeeList({
        page: 1,
        limit: 9999,
        feeStatus: feeStatusFilter,
        course: feeCourseFilter,
        search: feeDebouncedSearch,
      });
      const rows = res.data.data.applications.map((a) => ({
        "Application No.": a.applicationNumber || "",
        "Full Name": a.fullName || "",
        Course: a.appliedFor || "",
        Category: a.category || "",
        "Fee Amount (₹)": a.admissionFeeAmount || 0,
        "Fee Status": a.admissionFeeStatus
          ? a.admissionFeeStatus.toUpperCase()
          : "",
        "Payment Date": a.admissionFeeDate
          ? new Date(a.admissionFeeDate).toLocaleString("en-IN")
          : "",
        "Transaction ID": a.admissionTransactionId || "",
        "Offline Payment": a.markedPaidOffline ? "Yes" : "No",
        "Marked By": a.markedPaidBy || "",
        Note: a.markedPaidNote || "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Admission Fees");
      XLSX.writeFile(
        wb,
        `GIC_AdmissionFees_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      toast.success(`Exported ${rows.length} records`);
    } catch {
      toast.error("Export failed");
    } finally {
      setFeeExporting(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await settingsAPI.updateSettings({
        ...settingsForm,
        openDate: settingsForm.openDate || null,
        closeDate: settingsForm.closeDate || null,
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
    fetchFeeStats();
  }, []);

  useEffect(() => {
    if (activeTab === "fee") fetchFeeList();
  }, [fetchFeeList, activeTab]);

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
        toast.error("Session expired.");
        localStorage.clear();
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

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminAPI.updateApplicationStatus(id, newStatus);
      toast.success(`Application ${newStatus}`);
      fetchApplications();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const eligibleIds = applications
    .filter((a) => a.status === "submitted" || a.status === "under_review")
    .map((a) => a._id);
  const allEligibleSelected =
    eligibleIds.length > 0 &&
    eligibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = (clearOnly = false) => {
    if (clearOnly || allEligibleSelected) setSelectedIds([]);
    else setSelectedIds(eligibleIds);
  };

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const handleBulkStatus = async (newStatus) => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `${newStatus === "approved" ? "Approve" : "Reject"} ${selectedIds.length} selected application(s)?`,
      )
    )
      return;
    setBulkLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          adminAPI.updateApplicationStatus(id, newStatus),
        ),
      );
      toast.success(`${selectedIds.length} application(s) ${newStatus}`);
      setSelectedIds([]);
      fetchApplications();
    } catch {
      toast.error("Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const res = await adminAPI.getApplicationById(id);
      if (res.data.success) setViewApp(res.data.data.application);
    } catch {
      toast.error("Failed to load application");
    }
  };

  const handleEditClick = async (id) => {
    try {
      const res = await adminAPI.getApplicationById(id);
      if (res.data.success) setEditApp(res.data.data.application);
    } catch {
      toast.error("Failed to load application");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out");
    navigate("/admin/login");
  };

  const buildExportRow = (app) => ({
    "Application No.": app.applicationNumber || "",
    "Reference No.": app.referenceNumber || "",
    "Applied For": app.appliedFor || "",
    Session: app.session || "",
    "Full Name": app.fullName || "",
    "Father's Name": app.fatherName || "",
    "Mother's Name": app.motherName || "",
    DOB: app.dateOfBirth
      ? new Date(app.dateOfBirth).toLocaleDateString("en-IN")
      : "",
    Age: app.age || "",
    Gender: app.gender || "",
    Category: app.category || "",
    Religion: app.religion || "",
    "Mother Tongue": app.motherTongue || "",
    "Blood Group": app.bloodGroup || "",
    Nationality: app.nationality || "",
    "Height (cm)": app.studentHeight || "",
    "Weight (kg)": app.studentWeight || "",
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
    "Application Status": app.status ? app.status.toUpperCase() : "",
    "Payment Status": app.paymentStatus ? app.paymentStatus.toUpperCase() : "",
    "Amount Paid": app.amount || "",
    "Transaction ID": app.transactionId || "",
    "Razorpay Order ID": app.razorpayOrderId || "",
    "Razorpay Payment ID": app.razorpayPaymentId || "",
    "Payment Date": app.paymentDate
      ? new Date(app.paymentDate).toLocaleString("en-IN")
      : "",
    "Submitted At": app.createdAt
      ? new Date(app.createdAt).toLocaleString("en-IN")
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
      XLSX.writeFile(
        wb,
        `GIC_Applications_${mode === "filtered" ? "Filtered" : "All"}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      toast.success(`Exported ${rows.length} applications`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              GIC
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
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Portal Banner */}
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
                  Session: {settings.session}{" "}
                  {settings.closeDate &&
                    `· Deadline: ${new Date(settings.closeDate).toLocaleDateString("en-IN")}`}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Total"
            value={stats.totalApplications}
            color="bg-blue-50"
            icon={<span className="text-xl">📊</span>}
          />
          <StatCard
            label="Pending"
            value={stats.pendingApplications}
            color="bg-yellow-50"
            icon={<span className="text-xl">⏳</span>}
          />
          <StatCard
            label="Approved"
            value={stats.approvedApplications}
            color="bg-green-50"
            icon={<span className="text-xl">✅</span>}
          />
          <StatCard
            label="Rejected"
            value={stats.rejectedApplications}
            color="bg-red-50"
            icon={<span className="text-xl">❌</span>}
          />
          <StatCard
            label="Revenue"
            value={`₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`}
            color="bg-purple-50"
            icon={<span className="text-xl">💰</span>}
          />
          <StatCard
            label="Today"
            value={stats.todayApplications}
            color="bg-indigo-50"
            icon={<span className="text-xl">📅</span>}
          />
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #E5E7EB",
            padding: 4,
            width: "fit-content",
          }}
        >
          {[
            { id: "applications", label: "📋 Applications" },
            { id: "fee", label: "💳 Fee Management" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Applications Tab ─────────────────────────────────────────────── */}
        {activeTab === "applications" && (
          <>
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setStatusFilter(key);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === key ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full lg:w-64 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => doExport("filtered")}
                  disabled={exporting}
                  className="px-3 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Export Filtered
                </button>
                <button
                  onClick={() => doExport("all")}
                  disabled={exporting}
                  className="px-3 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Export All
                </button>
              </div>
            </div>

            {/* Application Table */}
            <ApplicationTable
              applications={applications}
              tableLoading={tableLoading}
              filterProps={{ debouncedSearch, statusFilter }}
              paginationProps={{
                page,
                limit,
                total,
                totalPages,
                setPage,
                setLimit,
              }}
              selectionProps={{
                selectedIds,
                toggleSelect,
                toggleSelectAll,
                allEligibleSelected,
                eligibleIds,
              }}
              actionProps={{
                handleView,
                handleEditClick,
                handleStatusChange,
                handleBulkStatus,
                bulkLoading,
              }}
            />
          </>
        )}

        {/* ── Fee Management Tab ────────────────────────────────────────────── */}
        {activeTab === "fee" && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Approved",
                  value: feeStats?.totalApproved ?? "—",
                  color: "bg-blue-50",
                  icon: "📋",
                },
                {
                  label: "Fee Paid",
                  value: feeStats?.totalPaid ?? "—",
                  color: "bg-green-50",
                  icon: "✅",
                },
                {
                  label: "Fee Pending",
                  value: feeStats?.totalPending ?? "—",
                  color: "bg-yellow-50",
                  icon: "⏳",
                },
                {
                  label: "Total Collected",
                  value: `₹${(feeStats?.totalCollection || 0).toLocaleString("en-IN")}`,
                  color: "bg-purple-50",
                  icon: "💰",
                },
              ].map((c) => (
                <StatCard
                  key={c.label}
                  label={c.label}
                  value={c.value}
                  color={c.color}
                  icon={<span className="text-xl">{c.icon}</span>}
                />
              ))}
            </div>

            {/* Course breakdown */}
            {feeStats?.courseBreakdown?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-500 mb-3">
                  Collection by course
                </p>
                <div className="flex gap-4 flex-wrap">
                  {feeStats.courseBreakdown.map((row) => (
                    <div
                      key={row._id}
                      className="bg-indigo-50 rounded-lg px-4 py-3 text-center min-w-[120px]"
                    >
                      <p className="text-xs text-indigo-500 font-semibold mb-1">
                        {row._id}
                      </p>
                      <p className="text-lg font-bold text-indigo-700">
                        {row.count} students
                      </p>
                      <p className="text-xs text-indigo-600">
                        ₹{(row.amount || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters + Export toolbar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
              <div className="flex gap-2 flex-wrap">
                {/* Fee status filters */}
                {[
                  { key: "all", label: "All" },
                  { key: "pending", label: "Pending" },
                  { key: "completed", label: "Online Paid" },
                  { key: "offline", label: "Offline Paid" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFeeStatusFilter(key);
                      setFeePage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${feeStatusFilter === key ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {label}
                  </button>
                ))}
                <span className="w-px bg-gray-200 self-stretch mx-1" />
                {/* Course filters */}
                {["all", "Science", "Commerce", "Arts"].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setFeeCourseFilter(c);
                      setFeePage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${feeCourseFilter === c ? "bg-teal-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {c === "all" ? "All Courses" : c}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by name / app no..."
                  value={feeSearch}
                  onChange={(e) => {
                    setFeeSearch(e.target.value);
                    clearTimeout(debounceTimer.current);
                    debounceTimer.current = setTimeout(() => {
                      setFeeDebouncedSearch(e.target.value);
                      setFeePage(1);
                    }, 400);
                  }}
                  className="w-52 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={exportFeeExcel}
                  disabled={feeExporting}
                  className="px-3 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  {feeExporting ? "Exporting…" : "Export Excel"}
                </button>
              </div>
            </div>

            {/* Fee table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {feeLoading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600" />
                </div>
              ) : feeList.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                  No approved applications found for the selected filters.
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {[
                            "App No.",
                            "Student",
                            "Course",
                            "Category",
                            "Fee Amount",
                            "Status",
                            "Date Paid",
                            "Action",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {feeList.map((app) => (
                          <tr
                            key={app._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-xs text-indigo-700 font-semibold">
                              {app.applicationNumber}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {app.fullName}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {app.appliedFor}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {app.category}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              ₹
                              {(app.admissionFeeAmount || 0).toLocaleString(
                                "en-IN",
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {app.admissionFeeStatus === "completed" ? (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${app.markedPaidOffline ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}
                                >
                                  {app.markedPaidOffline
                                    ? "Offline"
                                    : "Paid Online"}
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {app.admissionFeeDate
                                ? new Date(
                                    app.admissionFeeDate,
                                  ).toLocaleDateString("en-IN")
                                : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {app.admissionFeeStatus !== "completed" &&
                                (markingOffline === app._id ? (
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      placeholder="Note (optional)"
                                      value={offlineNote}
                                      onChange={(e) =>
                                        setOfflineNote(e.target.value)
                                      }
                                      className="text-xs border border-gray-300 rounded px-2 py-1 w-32 focus:ring-1 focus:ring-amber-400"
                                    />
                                    <button
                                      onClick={() =>
                                        confirmMarkOffline(app._id)
                                      }
                                      className="text-xs bg-green-600 text-white px-2 py-1 rounded font-semibold hover:bg-green-700"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => {
                                        setMarkingOffline(null);
                                        setOfflineNote("");
                                      }}
                                      className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleMarkOffline(app._id)}
                                    className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-200 transition-colors"
                                  >
                                    Mark Paid
                                  </button>
                                ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card view (mirrors ApplicationTable mobile pattern) */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {feeList.map((app) => (
                      <div key={app._id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {app.fullName}
                            </p>
                            <p className="font-mono text-xs text-indigo-600">
                              {app.applicationNumber}
                            </p>
                          </div>
                          {app.admissionFeeStatus === "completed" ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${app.markedPaidOffline ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}
                            >
                              {app.markedPaidOffline ? "Offline" : "Paid"}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{app.appliedFor}</span>
                          <span>{app.category}</span>
                          <span className="font-semibold text-gray-800">
                            ₹
                            {(app.admissionFeeAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </div>
                        {app.admissionFeeStatus !== "completed" &&
                          (markingOffline === app._id ? (
                            <div className="flex gap-2 items-center mt-2">
                              <input
                                type="text"
                                placeholder="Note (optional)"
                                value={offlineNote}
                                onChange={(e) => setOfflineNote(e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 flex-1 focus:ring-1 focus:ring-amber-400"
                              />
                              <button
                                onClick={() => confirmMarkOffline(app._id)}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded font-semibold"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => {
                                  setMarkingOffline(null);
                                  setOfflineNote("");
                                }}
                                className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleMarkOffline(app._id)}
                              className="mt-1 text-xs bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg font-semibold w-full hover:bg-amber-200"
                            >
                              Mark Paid (Offline / Cash)
                            </button>
                          ))}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pagination */}
              {feeTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
                  <span className="text-xs text-gray-500">
                    {feeTotal} total records
                  </span>
                  <div className="flex gap-2 items-center">
                    <button
                      disabled={feePage === 1}
                      onClick={() => setFeePage((p) => p - 1)}
                      className="px-3 py-1 rounded border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
                    >
                      Prev
                    </button>
                    <span className="text-sm font-medium">
                      {feePage} / {feeTotalPages}
                    </span>
                    <button
                      disabled={feePage === feeTotalPages}
                      onClick={() => setFeePage((p) => p + 1)}
                      className="px-3 py-1 rounded border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {viewApp && (
        <ApplicationDetailModal
          application={viewApp}
          onClose={() => setViewApp(null)}
          onEdit={() => {
            setEditApp(viewApp);
            setViewApp(null);
          }}
        />
      )}
      {editApp && (
        <ApplicationEditModal
          application={editApp}
          onClose={() => setEditApp(null)}
          onSaved={(u) => {
            setApplications((p) =>
              p.map((a) => (a._id === u._id ? { ...a, ...u } : a)),
            );
            setEditApp(null);
            toast.success("Updated");
          }}
        />
      )}
      <SettingsModal
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        settingsForm={settingsForm}
        setSettingsForm={setSettingsForm}
        handleSaveSettings={handleSaveSettings}
        savingSettings={savingSettings}
      />
    </div>
  );
};

export default AdminDashboard;
