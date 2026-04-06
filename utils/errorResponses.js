const AppError = require('./appError');

const badRequest = (message, details = null) => new AppError(400, message, details);
const unauthorized = (message, details = null) => new AppError(401, message, details);
const forbidden = (message, details = null) => new AppError(403, message, details);
const notFound = (message, details = null) => new AppError(404, message, details);

module.exports = {
  badRequest,
  forbidden,
  notFound,
  unauthorized
};
