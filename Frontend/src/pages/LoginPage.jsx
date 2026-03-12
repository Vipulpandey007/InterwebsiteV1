import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: mobile, 2: otp
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState(""); // "expired" | "invalid" | ""
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const cooldownRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Start 30-second cooldown timer
  const startCooldown = (seconds = 30) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(
    () => () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    },
    [],
  );

  // Step 1: Send OTP to registered mobile
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
        toast.success("OTP sent to +91 " + mobile);
        setStep(2);
        setOtpError("");
        startCooldown(30);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to send OTP";
      toast.error(errorMsg);

      // If mobile not registered, suggest signup
      if (errorMsg.includes("not registered") || errorMsg.includes("signup")) {
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
      const code = error.response?.data?.code;
      const msg = error.response?.data?.message;
      if (code === "OTP_EXPIRED") {
        setOtpError("expired");
        setOtp("");
      } else if (code === "OTP_INVALID") {
        setOtpError("invalid");
      } else {
        toast.error(msg || "Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await authAPI.resendOTP(mobile);
      toast.success("New OTP sent to +91 " + mobile);
      setOtp("");
      setOtpError("");
      startCooldown(30);
    } catch (error) {
      const code = error.response?.data?.code;
      const waitSec = error.response?.data?.waitSeconds;
      if (code === "RESEND_COOLDOWN" && waitSec) {
        startCooldown(waitSec);
        toast.error("Please wait before requesting another OTP");
      } else {
        toast.error(error.response?.data?.message || "Failed to resend OTP");
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

        {/* Login Card */}
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
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
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
              {/* OTP sent confirmation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                <p className="text-sm text-blue-800">
                  OTP sent to <strong>+91 {mobile}</strong>
                </p>
              </div>

              {/* Error banners */}
              {otpError === "expired" && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
                  <span className="text-amber-500 text-lg leading-none mt-0.5">
                    ⏰
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      OTP has expired
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Your OTP is no longer valid. Click{" "}
                      <strong>Resend OTP</strong> to get a new one.
                    </p>
                  </div>
                </div>
              )}
              {otpError === "invalid" && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                  <span className="text-red-500 text-lg leading-none mt-0.5">
                    ❌
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Incorrect OTP
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">
                      The OTP you entered does not match. Please check and try
                      again.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setOtpError("");
                  }}
                  className="input-field text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
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
                ) : (
                  "Verify OTP & Login"
                )}
              </button>

              {/* Actions */}
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                  }}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                  disabled={loading}
                >
                  Change Number
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading || cooldown > 0}
                  className={`font-medium transition-colors ${cooldown > 0 ? "text-gray-400 cursor-not-allowed" : "text-primary-600 hover:text-primary-700"}`}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {/* Development Note */}
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
