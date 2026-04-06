require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const financialRecordRoutes = require('./routes/financialRecords');
const dashboardRoutes = require('./routes/dashboard');
const AppError = require('./utils/appError');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure MongoDB connection is available in serverless environments.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/financial-records', financialRecordRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  console.error(err);

  if (err instanceof AppError) {
    const payload = { error: err.message };

    if (err.details) {
      payload.details = err.details;
    }

    return res.status(err.statusCode).json(payload);
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: Object.values(err.errors).map((e) => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Invalid ${err.path} format`
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ error: `${field} already exists` });
  }

  return res.status(err.statusCode || err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

module.exports = app;
