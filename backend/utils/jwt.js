const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sentinelscan_dev_fallback_secret_key_minimum_32_characters';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT token
 * @param {string} userId - User's MongoDB ObjectId string
 * @returns {string} - Signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} - Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};
