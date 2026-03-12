import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Rate limit state ──────────────────────────────────────────────────────
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [rateLimitMessage, setRateLimitMessage] = useState("");

  // ── Resend cooldown (30s) ─────────────────────────────────────────────────
  const [resendCooldown, setResendCooldown] = useState(0);
  const rlTimerRef = useRef(null);
  const rsTimerRef = useRef(null);

  // Rate limit countdown
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

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    rsTimerRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(rsTimerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(rsTimerRef.current);
  }, [resendCooldown]);

  // Returns true if the error was a 429 and we handled it
  const handle429 = (error) => {
    if (error.response?.status === 429) {
      const seconds = error.response.data?.retryAfter || 900;
      const message =
        error.response.data?.message || "Too many requests. Please wait.";
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

  // Step 1: Send OTP
  const handleLogin = async (e) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.login(mobile);
      if (response.data.success) {
        toast.success("OTP sent successfully! Check your phone.");
        setStep(2);
        setResendCooldown(30);
      }
    } catch (error) {
      if (!handle429(error)) {
        const errorMsg = error.response?.data?.message || "Failed to send OTP";
        toast.error(errorMsg);
        if (
          errorMsg.includes("not registered") ||
          errorMsg.includes("signup")
        ) {
          setTimeout(() => {
            toast(
              (t) => (
                <div>
                  <p className="font-semibold mb-2">Mobile not registered!</p>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate("/signup");
                    }}
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Go to Signup
                  </button>
                </div>
              ),
              { duration: 5000 },
            );
          }, 1000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.verifyLogin(mobile, otp);
      if (response.data.success) {
        const { token, user } = response.data.data;
        login(user, token);
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (error) {
      if (!handle429(error)) {
        toast.error(error.response?.data?.message || "Invalid OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || rateLimited) return;
    setLoading(true);
    try {
      await authAPI.resendOTP(mobile);
      toast.success("OTP resent successfully!");
      setResendCooldown(30);
    } catch (error) {
      if (!handle429(error)) {
        toast.error("Failed to resend OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <button
          onClick={() => navigate("/")}
          className="text-white hover:text-white/80 mb-6 flex items-center gap-2 transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎓</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {step === 1 ? "Student Login" : "Verify OTP"}
            </h1>
            <p className="text-gray-600">
              {step === 1
                ? "Enter your registered mobile number"
                : "Enter the OTP sent to your phone"}
            </p>
          </div>

          {/* ── Rate Limit Banner ──────────────────────────────────────────── */}
          {rateLimited && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🚫</span>
              <div className="flex-1">
                <p className="text-red-700 font-semibold text-sm">
                  {rateLimitMessage}
                </p>
                <p className="text-red-500 text-sm mt-1">
                  Try again in{" "}
                  <span className="font-bold text-red-700 tabular-nums">
                    {formatTime(rateLimitSeconds)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Mobile Number */}
          {step === 1 && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className="input-field pl-14"
                    placeholder="9876543210"
                    required
                    disabled={loading || rateLimited}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading || rateLimited}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </span>
                ) : rateLimited ? (
                  `Wait ${formatTime(rateLimitSeconds)}`
                ) : (
                  "Send OTP"
                )}
              </button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign up here
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  OTP sent to <strong>+91 {mobile}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="input-field text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading || rateLimited}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading || rateLimited}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </span>
                ) : rateLimited ? (
                  `Wait ${formatTime(rateLimitSeconds)}`
                ) : (
                  "Verify OTP & Login"
                )}
              </button>

              {/* Actions row */}
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setRateLimited(false);
                  }}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                  disabled={loading}
                >
                  ← Change Number
                </button>

                {/* Resend with cooldown timer */}
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading || resendCooldown > 0 || rateLimited}
                  className={`font-medium transition-colors ${
                    resendCooldown > 0 || rateLimited
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-primary-600 hover:text-primary-700"
                  }`}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {process.env.NODE_ENV === "development" && step === 2 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Dev Mode:</strong> Check backend console for OTP
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
