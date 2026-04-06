const FinancialRecord = require('../models/FinancialRecord');
const {
  applyRecordUpdates,
  buildRecordFilters,
  canAccessRecord,
  createRecordData,
  ensureRecordPayloadHasUpdates,
  findRecordById,
  findRecordWithOwnerById,
  listRecords,
  resolveRecordOwnerId,
  validateRecordFilters,
  validateRecordPayload
} = require('../services/financialRecordService');
const { badRequest, forbidden, notFound } = require('../utils/errorResponses');

exports.createRecord = async (req, res, next) => {
  try {
    const validationError = validateRecordPayload(req.body);
    if (validationError) {
      throw badRequest(validationError);
    }

    const ownerId = await resolveRecordOwnerId({
      userRole: req.userRole,
      userId: req.user.id,
      requestedUserId: req.body.userId
    });
    if (!ownerId) {
      throw notFound('Target user not found');
    }

    const record = await FinancialRecord.create(createRecordData({ body: req.body, ownerId }));

    const populatedRecord = await findRecordWithOwnerById(record._id);

    res.status(201).json({
      message: 'Financial record created successfully',
      record: populatedRecord
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecords = async (req, res, next) => {
  try {
    const filters = buildRecordFilters({
      userRole: req.userRole,
      userId: req.user.id,
      query: req.query
    });
    const filterError = validateRecordFilters(filters);
    if (filterError) {
      throw badRequest(filterError);
    }

    const records = await listRecords(filters);

    res.status(200).json({
      total: records.length,
      filters: req.query,
      records
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecordById = async (req, res, next) => {
  try {
    const record = await findRecordWithOwnerById(req.params.id);
    if (!record) {
      throw notFound('Financial record not found');
    }

    if (!canAccessRecord({ userRole: req.userRole, userId: req.user.id, record })) {
      throw forbidden('Cannot view this financial record');
    }

    res.status(200).json(record);
  } catch (error) {
    next(error);
  }
};

exports.updateRecord = async (req, res, next) => {
  try {
    ensureRecordPayloadHasUpdates(req.body);

    const validationError = validateRecordPayload(req.body, true);
    if (validationError) {
      throw badRequest(validationError);
    }

    const record = await findRecordById(req.params.id);
    if (!record) {
      throw notFound('Financial record not found');
    }

    if (!canAccessRecord({ userRole: req.userRole, userId: req.user.id, record })) {
      throw forbidden('Cannot update this financial record');
    }

    const updateError = await applyRecordUpdates({
      record,
      body: req.body,
      userRole: req.userRole
    });
    if (updateError) {
      throw notFound(updateError);
    }

    await record.save();

    const updatedRecord = await findRecordWithOwnerById(record._id);

    res.status(200).json({
      message: 'Financial record updated successfully',
      record: updatedRecord
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteRecord = async (req, res, next) => {
  try {
    const record = await findRecordById(req.params.id);
    if (!record) {
      throw notFound('Financial record not found');
    }

    if (!canAccessRecord({ userRole: req.userRole, userId: req.user.id, record })) {
      throw forbidden('Cannot delete this financial record');
    }

    await FinancialRecord.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Financial record deleted successfully' });
  } catch (error) {
    next(error);
  }
};
