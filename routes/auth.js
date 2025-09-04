const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  handleValidationErrors
} = require('../middleware/validation');
const {
  register,
  login,
  getAllUsers,
  getProfile,
  updateProfile,
  seedUsers
} = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.post('/seed', seedUsers);

// Protected routes
router.get('/users', auth, adminAuth, getAllUsers);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;
