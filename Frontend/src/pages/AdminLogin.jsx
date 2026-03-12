import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  // ── Rate limit / lockout state ────────────────────────────────────────────
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [loginError, setLoginError] = useState(""); // ← inline error
  const rlTimerRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    if (rateLimitSeconds <= 0) {
      setRateLimited(false);
      return;
    }
    rlTimerRef.current = setInterval(() => {
      setRateLimitSeconds((s) => {
        if (s <= 1) {
          clearInterval(rlTimerRef.current);
          setRateLimited(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(rlTimerRef.current);
  }, [rateLimitSeconds]);

  const handle429 = (error) => {
    if (error.response?.status === 429) {
      const seconds = error.response.data?.retryAfter || 900;
      const message =
        error.response.data?.message ||
        "Too many failed attempts. Please wait.";
      setRateLimited(true);
      setRateLimitSeconds(seconds);
      setRateLimitMessage(message);
      return true;
    }
    return false;
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec < 10 ? "0" : ""}${sec}s` : `${sec}s`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (loginError) setLoginError(""); // clear error on new input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.adminLogin(formData);

      if (response.data.success) {
        const { token, admin } = response.data.data;
        localStorage.setItem("adminToken", token);
        localStorage.setItem("admin", JSON.stringify(admin));
        setAttemptCount(0);
        setLoginError("");
        toast.success("Login successful!");
        navigate("/admin/dashboard");
      } else {
        const msg = response.data.message || "Invalid email or password";
        setLoginError(msg);
        toast.error(msg);
      }
    } catch (error) {
      if (!handle429(error)) {
        const newCount = attemptCount + 1;
        setAttemptCount(newCount);
        const msg =
          error.response?.data?.message || "Invalid email or password";
        setLoginError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Attempts remaining warning (shows after 6 failures, limit is 10)
  const attemptsRemaining = 10 - attemptCount;
  const showAttemptWarning = !rateLimited && attemptCount >= 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-12 w-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Gossner Intermediate College, Ranchi
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* ── Lockout Banner ────────────────────────────────────────────── */}
          {rateLimited && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔒</span>
                <p className="text-red-700 font-bold text-sm">
                  Account Temporarily Locked
                </p>
              </div>
              <p className="text-red-600 text-sm mb-3">{rateLimitMessage}</p>
              <div className="flex items-center gap-2 bg-red-100 rounded-lg px-3 py-2">
                <svg
                  className="w-4 h-4 text-red-500 flex-shrink-0"
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
                <span className="text-red-700 text-sm">
                  Unlocks in{" "}
                  <span className="font-bold tabular-nums text-red-800">
                    {formatTime(rateLimitSeconds)}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* ── Attempt Warning (6–9 failures) ───────────────────────────── */}
          {showAttemptWarning && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <p className="text-amber-800 text-sm font-medium">
                {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""}{" "}
                remaining before 15-minute lockout
              </p>
            </div>
          )}

          {/* ── Inline Error Banner (wrong password / invalid credentials) ─ */}
          {loginError && !rateLimited && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
              <span className="text-red-500 text-lg leading-none mt-0.5">
                ✗
              </span>
              <p className="text-red-700 text-sm font-medium">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="admin@gcraninter.org"
                disabled={loading || rateLimited}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your password"
                disabled={loading || rateLimited}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || rateLimited}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : rateLimited ? (
                `🔒 Locked — ${formatTime(rateLimitSeconds)}`
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Student Portal
                </span>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate("/login")}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Go to Student Login
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          © 2026 Gossner Intermediate College. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
