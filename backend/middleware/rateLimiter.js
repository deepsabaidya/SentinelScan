const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

// Stricter rate limiter for authentication endpoints (prevent brute-force password guessing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login/register attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before retrying.',
  },
});

// Assessment execution limiter to prevent target overloading
const scanLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 scans per 5 minutes per user/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Scan frequency threshold reached. Please wait before running more assessments.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  scanLimiter,
};
