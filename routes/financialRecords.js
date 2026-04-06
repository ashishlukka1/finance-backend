const express = require('express');
const router = express.Router();
const financialRecordController = require('../controllers/financialRecordController');
const authenticateToken = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../middleware/asyncHandler');
const validateObjectId = require('../middleware/validateObjectId');

router.use(authenticateToken);

router.get('/', authorize('viewer', 'analyst', 'admin'), asyncHandler(financialRecordController.getRecords));
router.get('/:id', validateObjectId(), authorize('viewer', 'analyst', 'admin'), asyncHandler(financialRecordController.getRecordById));
router.post('/', authorize('analyst', 'admin'), asyncHandler(financialRecordController.createRecord));
router.patch('/:id', validateObjectId(), authorize('analyst', 'admin'), asyncHandler(financialRecordController.updateRecord));
router.delete('/:id', validateObjectId(), authorize('admin'), asyncHandler(financialRecordController.deleteRecord));

module.exports = router;
