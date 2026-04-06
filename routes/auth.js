const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// Public routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

// Protected routes
router.get('/profile', authenticateToken, asyncHandler(authController.getProfile));

module.exports = router;
