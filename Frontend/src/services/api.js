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

    // Use admin token for admin routes, otherwise use user token
    if (config.url.startsWith("/admin") && adminToken) {
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
      // Check if admin or user route
      if (error.config.url.startsWith("/admin")) {
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
};

export default api;
