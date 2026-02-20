const { body, validationResult } = require("express-validator");

/**
 * Validation middleware wrapper
 * Checks for validation errors and returns formatted response
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

/**
 * Validation rules for sending OTP
 */
const validateSendOTP = [
  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be exactly 10 digits"),
  validate,
];

/**
 * Validation rules for verifying OTP
 */
const validateVerifyOTP = [
  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be exactly 10 digits"),
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .matches(/^[0-9]{6}$/)
    .withMessage("OTP must be exactly 6 digits"),
  validate,
];

/**
 * Validation rules for profile update
 */
const validateProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  validate,
];

/**
 * Validation rules for creating application
 */
const validateCreateApplication = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("fatherName")
    .trim()
    .notEmpty()
    .withMessage("Father's name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Father's name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be exactly 10 digits"),
  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Address must be between 10 and 500 characters"),
  body("course")
    .trim()
    .notEmpty()
    .withMessage("Course selection is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Course name must be between 2 and 100 characters"),
  body("twelfthMarks")
    .notEmpty()
    .withMessage("12th marks are required")
    .isFloat({ min: 0, max: 100 })
    .withMessage("12th marks must be between 0 and 100"),
  validate,
];

/**
 * Validation rules for updating application
 */
const validateUpdateApplication = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("fatherName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Father's name must be between 2 and 100 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("mobile")
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be exactly 10 digits"),
  body("address")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Address must be between 10 and 500 characters"),
  body("course")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Course name must be between 2 and 100 characters"),
  body("twelfthMarks")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("12th marks must be between 0 and 100"),
  validate,
];

module.exports = {
  validate,
  validateSendOTP,
  validateVerifyOTP,
  validateProfileUpdate,
  validateCreateApplication,
  validateUpdateApplication,
};
