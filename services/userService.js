const User = require('../models/User');
const { USER_ROLES, USER_STATUSES } = require('../constants/user');

const getActiveUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.status !== 'active') {
    return null;
  }

  return user;
};

const getUserById = async (userId) => User.findById(userId);

const buildUserUpdateData = ({ name, role, status }) => {
  const updateData = {};

  if (name) {
    updateData.name = name;
  }

  if (role) {
    updateData.role = role;
  }

  if (status) {
    updateData.status = status;
  }

  updateData.updatedAt = Date.now();

  return updateData;
};

const hasUserUpdates = (updateData) => Object.keys(updateData).some((key) => key !== 'updatedAt');

const validateUserRole = (role, { required = false } = {}) => {
  if (!role) {
    return required ? 'Invalid role provided' : null;
  }

  if (!USER_ROLES.includes(role)) {
    return 'Invalid role';
  }

  return null;
};

const validateUserStatus = (status) => {
  if (!status) {
    return null;
  }

  return USER_STATUSES.includes(status) ? null : 'Invalid status';
};

module.exports = {
  buildUserUpdateData,
  hasUserUpdates,
  getActiveUserById,
  getUserById,
  validateUserRole,
  validateUserStatus
};
