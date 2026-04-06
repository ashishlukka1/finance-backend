const jwt = require('jsonwebtoken');
const { forbidden, unauthorized } = require('../utils/errorResponses');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return next(unauthorized('Access token required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = decoded;
    next();
  } catch (error) {
    return next(forbidden('Invalid or expired token'));
  }
};

module.exports = authenticateToken;
