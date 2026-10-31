const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'sentinelscan_dev_fallback_secret_key_minimum_32_characters'
      );

      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User session has expired or the account no longer exists.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('[Auth Middleware] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Token is invalid, expired, or malformed.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token was provided.',
    });
  }
};

module.exports = { protect };
