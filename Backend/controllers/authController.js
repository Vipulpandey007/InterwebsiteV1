const User = require("../models/User");
const { generateToken } = require("../utils/jwtUtils");
const { sendOTP } = require("../utils/otpService");

/**
 * @desc    Send OTP to mobile number
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOTPController = async (req, res) => {
  try {
    const { mobile } = req.body;

    // Validate mobile number
    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // Validate mobile number format (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number",
      });
    }

    // Check if user exists, if not create new user
    let user = await User.findOne({ mobile });

    if (!user) {
      user = new User({ mobile });
    }

    // Generate OTP
    const otp = user.generateOTP();

    // Save user with OTP
    await user.save();

    // Send OTP via SMS
    try {
      await sendOTP(mobile, otp);
    } catch (error) {
      console.error("OTP Send Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        mobile: mobile,
        expiresIn: "10 minutes",
      },
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

/**
 * @desc    Verify OTP and login user
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTPController = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // Validate input
    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required",
      });
    }

    // Validate OTP format (6 digits)
    if (!/^[0-9]{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be 6 digits",
      });
    }

    // Find user (select OTP fields which are excluded by default)
    const user = await User.findOne({ mobile }).select(
      "+otp +otpExpiry +otpAttempts +otpLockedUntil",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please request OTP first.",
      });
    }

    // Check if user is locked out due to too many failed attempts
    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.otpLockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Please try again in ${minutesLeft} minute(s).`,
      });
    }

    // Check if OTP exists
    if (!user.otp) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new OTP.",
      });
    }

    // Verify OTP
    const isValidOTP = user.verifyOTP(otp);

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please try again.",
      });
    }

    // Clear OTP and mark as verified
    user.clearOTP();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: token,
        user: {
          id: user._id,
          mobile: user.mobile,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
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
        message: "Mobile number is required",
      });
    }

    // Find user
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please send OTP first.",
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP
    try {
      await sendOTP(mobile, otp);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      data: {
        mobile: mobile,
        expiresIn: "10 minutes",
      },
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private (requires JWT token)
 */
const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id).select("-otp -otpExpiry");

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
          mobile: user.mobile,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get Current User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) {
      // Validate email format
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }
      user.email = email.toLowerCase().trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          mobile: user.mobile,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  // This endpoint can be used for logging purposes or token blacklisting if implemented

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

module.exports = {
  sendOTPController,
  verifyOTPController,
  resendOTPController,
  getCurrentUser,
  updateProfile,
  logout,
};
