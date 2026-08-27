const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getAllUsers,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public auth endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected user endpoints
router.get('/me', protect, getMe);
router.get('/users', protect, getAllUsers);

module.exports = router;
