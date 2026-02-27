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

// Auth APIs
// export const authAPI = {
//   sendOTP: (mobile) => api.post("/auth/send-otp", { mobile }),
//   verifyOTP: (mobile, otp) => api.post("/auth/verify-otp", { mobile, otp }),
//   getProfile: () => api.get("/auth/me"),
//   logout: () => api.post("/auth/logout"),
// };

export const authAPI = {
  // Signup
  signup: (data) => api.post("/auth/signup", data),
  verifySignup: (mobile, otp) =>
    api.post("/auth/verify-signup", { mobile, otp }),

  // Login
  login: (mobile) => api.post("/auth/login", { mobile }),
  verifyLogin: (mobile, otp) => api.post("/auth/verify-login", { mobile, otp }),

  // OTP
  resendOTP: (mobile) => api.post("/auth/resend-otp", { mobile }),

  // User
  getProfile: () => api.get("/auth/me"),
};

// Application APIs
export const applicationAPI = {
  create: (data) => api.post("/applications", data),
  getMyApplications: () => api.get("/applications/my-applications"),
  getById: (id) => api.get(`/applications/${id}`),
  update: (id, data) => api.put(`/applications/${id}`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  delete: (id) => api.delete(`/applications/${id}`),
};

// Payment APIs
export const paymentAPI = {
  createOrder: (applicationId) =>
    api.post("/payment/create-order", { applicationId }),
  verifyPayment: (data) => api.post("/payment/verify", data),
  getStatus: (applicationId) => api.get(`/payment/status/${applicationId}`),
};

// PDF APIs
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
