const jwt = require("jsonwebtoken");

/**
 * Generate JWT token for authenticated user
 * @param {String} userId - User's MongoDB _id
 * @param {String} role - User's role (user/admin)
 * @returns {String} JWT token
 */
const generateToken = (userId, role = "user") => {
  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d", // Token expires in 30 days
    }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
