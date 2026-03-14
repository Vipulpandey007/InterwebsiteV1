import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - CRITICAL: Must add Authorization header
api.interceptors.request.use(
  (config) => {
    console.log("🔍 API Request:", config.method?.toUpperCase(), config.url);

    // Get tokens from localStorage
    const token = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");

    console.log("📦 Tokens available:", {
      userToken: token ? "EXISTS" : "MISSING",
      adminToken: adminToken ? "EXISTS" : "MISSING",
    });

    // 🚨 FIX: Only apply the admin token to explicit admin routes
    const isAdminRoute =
      config.url.startsWith("/admin") ||
      config.url.startsWith("/admission-fee/stats") ||
      config.url.startsWith("/admission-fee/list") ||
      config.url.includes("/mark-offline");

    if (isAdminRoute && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      console.log("✅ Added admin token to request");
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Added user token to request");
    } else {
      console.log("⚠️  No token added to request");
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error("❌ API Error:", error.config?.url, error.response?.status);

    if (error.response?.status === 401) {
      // 🚨 FIX: Use the same precise check so students aren't redirected to the admin login
      const isAdminRoute =
        error.config.url.startsWith("/admin") ||
        error.config.url.startsWith("/admission-fee/stats") ||
        error.config.url.startsWith("/admission-fee/list") ||
        error.config.url.includes("/mark-offline");

      if (isAdminRoute) {
        console.log("🔒 Admin session expired, redirecting to admin login");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        window.location.href = "/admin/login";
        toast.error("Admin session expired");
      } else {
        console.log("🔒 User session expired, redirecting to user login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        toast.error("Session expired");
      }
    }
    return Promise.reject(error);
  },
);

// ==================== AUTH APIs ====================
export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  verifySignup: (mobile, otp) =>
    api.post("/auth/verify-signup", { mobile, otp }),
  login: (mobile) => api.post("/auth/login", { mobile }),
  verifyLogin: (mobile, otp) => api.post("/auth/verify-login", { mobile, otp }),
  resendOTP: (mobile) => api.post("/auth/resend-otp", { mobile }),
  getProfile: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),

  // Admin auth
  adminLogin: (data) => api.post("/admin/login", data),
};

// ==================== APPLICATION APIs ====================
export const applicationAPI = {
  create: (data) => api.post("/applications", data),
  createWithFiles: (formData) => {
    const token = localStorage.getItem("token");
    console.log("📤 Uploading files with token:", token ? "EXISTS" : "MISSING");

    return axios.post("/api/applications", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    });
  },
  getMyApplications: () => api.get("/applications/my-applications"),
  getById: (id) => api.get(`/applications/${id}`),
  update: (id, data) => api.put(`/applications/${id}`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  delete: (id) => api.delete(`/applications/${id}`),
};

// ==================== PAYMENT APIs ====================
export const paymentAPI = {
  createOrder: (applicationId) =>
    api.post("/payment/create-order", { applicationId }),
  verifyPayment: (data) => api.post("/payment/verify", data),
  getStatus: (applicationId) => api.get(`/payment/status/${applicationId}`),
};

// ==================== PDF APIs ====================
export const pdfAPI = {
  generate: (applicationId) => api.post(`/pdf/generate/${applicationId}`),
  getStatus: (applicationId) => api.get(`/pdf/status/${applicationId}`),
  applicationSummaryURL: (applicationId) => {
    const token = localStorage.getItem("token");
    return `/api/pdf/application-summary/${applicationId}?token=${token}`;
  },
  downloadURL: (applicationId) => {
    const token = localStorage.getItem("token");
    return `/api/pdf/download/${applicationId}?token=${token}`;
  },
};

// ==================== ADMIN APIs ====================
export const adminAPI = {
  // Auth
  login: (data) => api.post("/admin/login", data),
  createAdmin: (data) => api.post("/admin/create", data),

  // Dashboard
  getStats: () => {
    console.log("📊 Fetching admin stats...");
    return api.get("/admin/stats");
  },

  // Applications
  getAllApplications: (params = {}) => {
    const { page = 1, limit = 20, status, search } = params;
    const query = new URLSearchParams({ page, limit });
    if (status && status !== "all") query.set("status", status);
    if (search) query.set("search", search);
    console.log("📋 Fetching applications:", query.toString());
    return api.get(`/admin/applications?${query.toString()}`);
  },
  getApplicationById: (id) => api.get(`/admin/applications/${id}`),
  updateApplication: (id, data) => api.put(`/admin/applications/${id}`, data),
  updateApplicationStatus: (id, status) => {
    console.log("🔄 Updating application status:", id, status);
    return api.put(`/admin/applications/${id}/status`, { status });
  },
  // ─── ADDED ACTIVITY LOG FUNCTION HERE ──────────────────────────────
  getActivityLog: (id) => {
    console.log("📜 Fetching activity log for application:", id);
    return api.get(`/admin/applications/${id}/activity`);
  },

  // Change admin password
  changePassword: (data) => api.put("/admin/change-password", data),
};

export default api;

// ==================== SETTINGS API ====================
export const settingsAPI = {
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data) => api.put("/admin/settings", data),
};

// ==================== ADMISSION FEE APIs ====================
export const admissionFeeAPI = {
  // Student — create Razorpay order for admission fee
  createOrder: (applicationId) =>
    api.post("/admission-fee/create-order", { applicationId }),

  // Student — verify Razorpay payment
  verifyPayment: (data) => api.post("/admission-fee/verify", data),

  // Student — receipt PDF download URL (opened via window.open, needs absolute URL)
  receiptURL: (applicationId) => {
    const token = localStorage.getItem("token");
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${base}/api/admission-fee/receipt/${applicationId}?token=${token}`;
  },

  // Admin — fee management stats
  getFeeStats: () => api.get("/admission-fee/stats"),

  // Admin — paginated fee list
  getFeeList: (params = {}) => {
    const { page = 1, limit = 20, feeStatus, course, search } = params;
    const query = new URLSearchParams({ page, limit });
    if (feeStatus && feeStatus !== "all") query.set("feeStatus", feeStatus);
    if (course && course !== "all") query.set("course", course);
    if (search) query.set("search", search);
    return api.get(`/admission-fee/list?${query.toString()}`);
  },

  // Admin — mark application's admission fee as paid offline
  markOfflinePaid: (applicationId, note) =>
    api.post(`/admission-fee/${applicationId}/mark-offline`, { note }),
};
