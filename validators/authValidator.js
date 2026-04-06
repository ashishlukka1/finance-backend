const { badRequest } = require('../utils/errorResponses');

const isValidEmail = (email) => /.+\@.+\..+/.test(String(email).trim());

const validateRegistrationInput = ({ name, email, password, confirmPassword }) => {
  if (!name || !email || !password || !confirmPassword) {
    throw badRequest('All fields are required');
  }

  if (!String(name).trim()) {
    throw badRequest('Name is required');
  }

  if (!isValidEmail(email)) {
    throw badRequest('A valid email is required');
  }

  if (password !== confirmPassword) {
    throw badRequest('Passwords do not match');
  }

  if (String(password).length < 8) {
    throw badRequest('Password must be at least 8 characters');
  }
};

const validateLoginInput = ({ email, password }) => {
  if (!email || !password) {
    throw badRequest('Email and password required');
  }

  if (!isValidEmail(email)) {
    throw badRequest('A valid email is required');
  }
};

module.exports = {
  validateLoginInput,
  validateRegistrationInput
};
