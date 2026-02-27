const User = require("../models/User");
const { generateToken } = require("../utils/jwtUtils");
const { sendOTP } = require("../utils/smsService");

/**
 * @desc    Register new user (Step 1: Signup)
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signupController = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    // Validate input
    if (!name || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and mobile number",
      });
    }

    // Check if mobile already exists
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      mobile,
      isVerified: false,
      isMobileVerified: false,
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP
    try {
      await sendOTP(mobile, otp);
      console.log(`📱 OTP for ${mobile}: ${otp}`);
    } catch (error) {
      console.error("SMS Error:", error);
    }

    res.status(201).json({
      success: true,
      message: "Signup successful! OTP sent to your mobile number",
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({
      success: false,
      message: "Signup failed. Please try again.",
    });
  }
};

/**
 * @desc    Verify OTP and complete signup (Step 2)
 * @route   POST /api/auth/verify-signup
 * @access  Public
 */
const verifySignupController = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide mobile number and OTP",
      });
    }

    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please signup first.",
      });
    }

    if (user.isMobileVerified) {
      return res.status(400).json({
        success: false,
        message: "Mobile already verified. Please login.",
      });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.isMobileVerified = true;
    user.clearOTP();
    user.updateLastLogin();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Signup completed successfully!",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          isVerified: user.isVerified,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Verify Signup Error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
};

/**
 * @desc    Login (Step 1: Send OTP)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginController = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Please provide mobile number",
      });
    }

    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Mobile number not registered. Please signup first.",
      });
    }

    if (!user.isMobileVerified) {
      return res.status(400).json({
        success: false,
        message: "Mobile not verified. Please complete signup first.",
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP
    try {
      await sendOTP(mobile, otp);
      console.log(`📱 OTP for ${mobile}: ${otp}`);
    } catch (error) {
      console.error("SMS Error:", error);
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

/**
 * @desc    Verify OTP and login (Step 2)
 * @route   POST /api/auth/verify-login
 * @access  Public
 */
const verifyLoginController = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide mobile number and OTP",
      });
    }

    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.clearOTP();
    user.updateLastLogin();
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          isVerified: user.isVerified,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Verify Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Login verification failed. Please try again.",
    });
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOTPController = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Please provide mobile number",
      });
    }

    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = user.generateOTP();
    await user.save();

    try {
      await sendOTP(mobile, otp);
      console.log(`📱 OTP for ${mobile}: ${otp}`);
    } catch (error) {
      console.error("SMS Error:", error);
    }

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      data: {
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP. Please try again.",
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMeController = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-otp -otpExpires");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          isVerified: user.isVerified,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user data",
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutController = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

// ✅ IMPORTANT: Export ALL functions
module.exports = {
  signupController,
  verifySignupController,
  loginController,
  verifyLoginController,
  resendOTPController,
  getMeController,
  logoutController,
};
