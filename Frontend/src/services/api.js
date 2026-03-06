import axios from "axios";
import toast from "react-hot-toast";

// Create axios instance
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     API REQUEST INTERCEPTOR            ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("📤 URL:", config.url);
    console.log("📤 Method:", config.method?.toUpperCase());
    console.log("📤 Base URL:", config.baseURL);
    console.log("📤 Full URL:", config.baseURL + config.url);

    const token = localStorage.getItem("token");
    console.log("🔑 Token in localStorage:", token ? "EXISTS" : "❌ MISSING");

    if (token) {
      console.log("🔑 Token (first 50 chars):", token.substring(0, 50) + "...");
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Authorization header added to request");
      console.log(
        "📤 Authorization:",
        config.headers.Authorization.substring(0, 50) + "...",
      );
    } else {
      console.warn("⚠️  WARNING: No token found in localStorage!");
      console.warn(
        "⚠️  This request will likely fail if it requires authentication",
      );
    }

    console.log(
      "📤 All Request Headers:",
      JSON.stringify(config.headers, null, 2),
    );

    if (config.data) {
      console.log("📤 Request Body:", JSON.stringify(config.data, null, 2));
    }

    console.log("╚════════════════════════════════════════╝\n");

    return config;
  },
  (error) => {
    console.error("\n❌ REQUEST INTERCEPTOR ERROR");
    console.error("Error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     API RESPONSE SUCCESS               ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("✅ Status:", response.status, response.statusText);
    console.log("✅ URL:", response.config.url);
    console.log("✅ Data:", JSON.stringify(response.data, null, 2));
    console.log("╚════════════════════════════════════════╝\n");

    return response;
  },
  (error) => {
    console.error("\n╔════════════════════════════════════════╗");
    console.error("║     API RESPONSE ERROR                 ║");
    console.error("╚════════════════════════════════════════╝");
    console.error("❌ URL:", error.config?.url);
    console.error("❌ Method:", error.config?.method);
    console.error("❌ Status:", error.response?.status);
    console.error("❌ Status Text:", error.response?.statusText);
    console.error("❌ Error Message:", error.message);

    if (error.response?.data) {
      console.error(
        "❌ Response Data:",
        JSON.stringify(error.response.data, null, 2),
      );
    }

    if (error.config?.headers) {
      console.error(
        "❌ Request Headers:",
        JSON.stringify(error.config.headers, null, 2),
      );
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.error("\n🚨 401 UNAUTHORIZED - SESSION EXPIRED");
      console.error("🚨 Clearing localStorage and redirecting to login...");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      toast.error("Session expired. Please login again.");

      // Delay redirect slightly to allow toast to show
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("\n🚨 403 FORBIDDEN - ACCESS DENIED");
      console.error("🚨 Token might be invalid or expired");

      toast.error("Access denied. Please try logging in again.");
    }

    console.error("╚════════════════════════════════════════╝\n");

    return Promise.reject(error);
  },
);

// ==================== AUTH APIs ====================
export const authAPI = {
  signup: (data) => {
    console.log("📝 Calling authAPI.signup");
    return api.post("/auth/signup", data);
  },

  verifySignup: (mobile, otp) => {
    console.log("📝 Calling authAPI.verifySignup");
    return api.post("/auth/verify-signup", { mobile, otp });
  },

  login: (mobile) => {
    console.log("📝 Calling authAPI.login");
    return api.post("/auth/login", { mobile });
  },

  verifyLogin: (mobile, otp) => {
    console.log("📝 Calling authAPI.verifyLogin");
    return api.post("/auth/verify-login", { mobile, otp });
  },

  resendOTP: (mobile) => {
    console.log("📝 Calling authAPI.resendOTP");
    return api.post("/auth/resend-otp", { mobile });
  },

  getProfile: () => {
    console.log("📝 Calling authAPI.getProfile");
    return api.get("/auth/me");
  },

  logout: () => {
    console.log("📝 Calling authAPI.logout");
    return api.post("/auth/logout");
  },
};

// ==================== APPLICATION APIs ====================
export const applicationAPI = {
  create: (data) => {
    console.log("📝 Calling applicationAPI.create");
    console.log("📝 Data:", data);
    return api.post("/applications", data);
  },

  getMyApplications: () => {
    console.log("📝 Calling applicationAPI.getMyApplications");
    return api.get("/applications/my-applications");
  },

  getById: (id) => {
    console.log("📝 Calling applicationAPI.getById:", id);
    return api.get(`/applications/${id}`);
  },

  update: (id, data) => {
    console.log("📝 Calling applicationAPI.update:", id);
    return api.put(`/applications/${id}`, data);
  },

  submit: (id) => {
    console.log("📝 Calling applicationAPI.submit:", id);
    return api.post(`/applications/${id}/submit`);
  },

  delete: (id) => {
    console.log("📝 Calling applicationAPI.delete:", id);
    return api.delete(`/applications/${id}`);
  },
};

// ==================== PAYMENT APIs ====================
export const paymentAPI = {
  createOrder: (applicationId) => {
    console.log("📝 Calling paymentAPI.createOrder:", applicationId);
    return api.post("/payment/create-order", { applicationId });
  },

  verifyPayment: (data) => {
    console.log("📝 Calling paymentAPI.verifyPayment");
    return api.post("/payment/verify", data);
  },

  getStatus: (applicationId) => {
    console.log("📝 Calling paymentAPI.getStatus:", applicationId);
    return api.get(`/payment/status/${applicationId}`);
  },
};

// ==================== PDF APIs ====================
export const pdfAPI = {
  generate: (applicationId) => {
    console.log("📝 Calling pdfAPI.generate:", applicationId);
    return api.post(`/pdf/generate/${applicationId}`);
  },

  getStatus: (applicationId) => {
    console.log("📝 Calling pdfAPI.getStatus:", applicationId);
    return api.get(`/pdf/status/${applicationId}`);
  },

  downloadURL: (applicationId) => {
    const token = localStorage.getItem("token");
    const url = `/api/pdf/download/${applicationId}?token=${token}`;
    console.log("📝 Generated PDF download URL:", url);
    return url;
  },

  viewURL: (applicationId) => {
    const token = localStorage.getItem("token");
    const url = `/api/pdf/view/${applicationId}?token=${token}`;
    console.log("📝 Generated PDF view URL:", url);
    return url;
  },
};

export default api;
