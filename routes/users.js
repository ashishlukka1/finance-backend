const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../middleware/asyncHandler');
const validateObjectId = require('../middleware/validateObjectId');

// All routes require authentication
router.use(authenticateToken);

// Get all users (Admin only)
router.get('/', authorize('admin'), asyncHandler(userController.getAllUsers));

// Get user by ID
router.get('/:id', validateObjectId(), authorize('viewer', 'analyst', 'admin'), asyncHandler(userController.getUserById));

// Update user information (Admin only)
router.patch('/:id', validateObjectId(), authorize('admin'), asyncHandler(userController.updateUser));

// Delete user (Admin only)
router.delete('/:id', validateObjectId(), authorize('admin'), asyncHandler(userController.deleteUser));

// Change user role (Admin only)
router.patch('/:id/role', validateObjectId(), authorize('admin'), asyncHandler(userController.changeUserRole));

// Toggle user status (Admin only)
router.patch('/:id/status', validateObjectId(), authorize('admin'), asyncHandler(userController.toggleUserStatus));

module.exports = router;
