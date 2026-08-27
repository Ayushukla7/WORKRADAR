const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token (JWT) for user authentication.
 * @param {string} id - User MongoDB ObjectId
 * @param {string} role - User role ('MANAGER' or 'EMPLOYEE')
 * @returns {string} - Signed JWT token valid for 30 days
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'workradar_super_secret_jwt_key_2026_safe_dev',
    { expiresIn: '30d' }
  );
};

module.exports = generateToken;
