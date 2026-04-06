const { getActiveUserById } = require('../services/userService');
const { forbidden, unauthorized } = require('../utils/errorResponses');

const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(unauthorized('User not authenticated'));
      }

      const user = await getActiveUserById(req.user.id);
      if (!user) {
        return next(forbidden('User account is inactive or not found'));
      }

      if (!allowedRoles.includes(user.role)) {
        return next(forbidden('Insufficient permissions'));
      }

      req.currentUser = user;
      req.userRole = user.role;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorize;
