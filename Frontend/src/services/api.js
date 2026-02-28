import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      toast.error("Session expired. Please login again.");
    }
    return Promise.reject(error);
  },
);

// ==================== AUTH APIs ====================
export const authAPI = {
  // Signup (Step 1: Register with name, email, mobile)
  signup: (data) => api.post("/auth/signup", data),

  // Verify Signup (Step 2: Verify OTP and complete registration)
  verifySignup: (mobile, otp) =>
    api.post("/auth/verify-signup", { mobile, otp }),

  // Login (Step 1: Send OTP to registered mobile)
  login: (mobile) => api.post("/auth/login", { mobile }),

  // Verify Login (Step 2: Verify OTP and login)
  verifyLogin: (mobile, otp) => api.post("/auth/verify-login", { mobile, otp }),

  // Resend OTP (works for both signup and login)
  resendOTP: (mobile) => api.post("/auth/resend-otp", { mobile }),

  // Get current user profile
  getProfile: () => api.get("/auth/me"),

  // Logout
  logout: () => api.post("/auth/logout"),
};

// ==================== APPLICATION APIs ====================
export const applicationAPI = {
  create: (data) => api.post("/applications", data),
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
  viewURL: (applicationId) => {
    const token = localStorage.getItem("token");
    return `/api/pdf/view/${applicationId}?token=${token}`;
  },
};

export default api;
