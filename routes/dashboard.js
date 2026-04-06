const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../middleware/asyncHandler');

router.use(authenticateToken);
router.use(authorize('analyst', 'admin'));

router.get('/summary', asyncHandler(dashboardController.getSummary));

module.exports = router;
