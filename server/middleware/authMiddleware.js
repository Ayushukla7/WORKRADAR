const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect Middleware: Verifies JWT token in Authorization header.
 * Attaches decoded user document to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header ("Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'workradar_super_secret_jwt_key_2026_safe_dev'
      );

      // Fetch user from database excluding password field
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists',
        });
      }

      next();
    } catch (error) {
      console.error('[Auth Middleware Error]: Token verification failed', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid or expired',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no authentication token provided',
    });
  }
};

/**
 * Authorize Middleware: Restricts access to specific user roles (e.g. 'MANAGER').
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'Guest'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
