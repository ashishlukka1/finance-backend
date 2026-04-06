const User = require('../models/User');
const {
  buildUserUpdateData,
  hasUserUpdates,
  validateUserRole,
  validateUserStatus
} = require('../services/userService');
const { badRequest, forbidden, notFound } = require('../utils/errorResponses');

// Get all users (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      total: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id && req.userRole !== 'admin') {
      throw forbidden('Cannot view other user profiles');
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      throw notFound('User not found');
    }

    res.status(200).json(user.toJSON());
  } catch (error) {
    next(error);
  }
};

// Update user (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, status } = req.body;

    const roleError = validateUserRole(role);
    if (roleError) {
      throw badRequest(roleError);
    }

    const statusError = validateUserStatus(status);
    if (statusError) {
      throw badRequest(statusError);
    }

    const updateData = buildUserUpdateData({ name, role, status });
    if (!hasUserUpdates(updateData)) {
      throw badRequest('At least one field is required to update a user');
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!user) {
      throw notFound('User not found');
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      throw badRequest('Cannot delete your own account');
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw notFound('User not found');
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Change user role (Admin only)
exports.changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const roleError = validateUserRole(role, { required: true });
    if (roleError) {
      throw badRequest(roleError);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    if (!user) {
      throw notFound('User not found');
    }

    res.status(200).json({
      message: 'User role updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// Toggle user status (Admin only)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      throw notFound('User not found');
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    user.status = newStatus;
    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      message: `User status changed to ${newStatus}`,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};
