const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { notFound, unauthorized } = require('../utils/errorResponses');
const { validateLoginInput, validateRegistrationInput } = require('../validators/authValidator');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
};

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    validateRegistrationInput({ name, email, password, confirmPassword });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user (default role: viewer)
    const newUser = new User({
      name,
      email,
      password,
      role: 'viewer',
      status: 'active'
    });

    await newUser.save();

    const token = generateToken(newUser);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    validateLoginInput({ email, password });

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw unauthorized('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw unauthorized('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw unauthorized('Invalid credentials');
    }

    const token = generateToken(user);
    res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw notFound('User not found');
    }
    res.status(200).json(user.toJSON());
  } catch (error) {
    next(error);
  }
};
