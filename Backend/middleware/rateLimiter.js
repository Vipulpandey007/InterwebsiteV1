const rateLimit = require("express-rate-limit");

// ─── Shared handler: returns clean JSON on rate limit hit ────────────────────
const makeHandler = (message) => (req, res) => {
  const retryAfter = Math.ceil(res.getHeader("Retry-After") || 60);
  console.warn(`⚠️  Rate limit hit — IP: ${req.ip} → ${req.originalUrl}`);
  res.status(429).json({
    success: false,
    message,
    retryAfter,
  });
};

// ─── 1. OTP Request Limiter ──────────────────────────────────────────────────
// Routes:  POST /api/auth/signup, POST /api/auth/login
// Limit:   5 OTP sends per IP per 15 minutes
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler(
    "Too many OTP requests. Please wait 15 minutes before requesting another OTP.",
  ),
});

// ─── 2. OTP Verify Limiter ───────────────────────────────────────────────────
// Routes:  POST /api/auth/verify-signup, POST /api/auth/verify-login
// Limit:   10 attempts per IP per 15 minutes
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler(
    "Too many OTP verification attempts. Please wait 15 minutes before trying again.",
  ),
});

// ─── 3. Resend OTP Limiter ───────────────────────────────────────────────────
// Route:   POST /api/auth/resend-otp
// Limit:   3 resends per IP per 15 minutes
const resendOTPLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler(
    "Too many resend requests. Please wait 15 minutes before requesting another OTP.",
  ),
});

// ─── 4. Admin Login Limiter ──────────────────────────────────────────────────
// Route:   POST /api/admin/login
// Limit:   10 failed attempts per IP per 15 minutes
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: makeHandler(
    "Too many failed login attempts. Admin access is locked for 15 minutes.",
  ),
});

// ─── 5. PDF Limiter ──────────────────────────────────────────────────────────
// Routes:  POST /api/pdf/generate/:id, GET /api/pdf/download/:id
// Limit:   10 requests per IP per 10 minutes
const pdfLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler(
    "Too many PDF requests. Please wait 10 minutes before trying again.",
  ),
});

// ─── 6. General API Safety Net ───────────────────────────────────────────────
// Routes:  ALL /api/* routes
// Limit:   200 requests per IP per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler(
    "Too many requests from this IP. Please slow down and try again in 15 minutes.",
  ),
});

module.exports = {
  otpRequestLimiter,
  otpVerifyLimiter,
  resendOTPLimiter,
  adminLoginLimiter,
  pdfLimiter,
  generalLimiter,
};
