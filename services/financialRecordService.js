const FinancialRecord = require('../models/FinancialRecord');
const { FINANCIAL_RECORD_TYPES } = require('../constants/financialRecord');
const { getUserById } = require('./userService');
const { badRequest } = require('../utils/errorResponses');

const parseDateRange = ({ dateFrom, dateTo }) => {
  if (!dateFrom && !dateTo) {
    return null;
  }

  const date = {};

  if (dateFrom) {
    const startDate = new Date(dateFrom);
    startDate.setHours(0, 0, 0, 0);
    date.$gte = startDate;
  }

  if (dateTo) {
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
    date.$lte = endDate;
  }

  return date;
};

const hasInvalidDateRange = (dateRange) => {
  if (!dateRange) {
    return false;
  }

  return (dateRange.$gte && Number.isNaN(dateRange.$gte.getTime())) ||
    (dateRange.$lte && Number.isNaN(dateRange.$lte.getTime()));
};

const buildRecordAccessScope = ({ userRole, userId, scopedUserId }) => {
  if (userRole === 'viewer') {
    return { createdBy: userId };
  }

  if (scopedUserId) {
    return { createdBy: scopedUserId };
  }

  return {};
};

const buildRecordFilters = ({ userRole, userId, query }) => {
  const filters = buildRecordAccessScope({
    userRole,
    userId,
    scopedUserId: query.userId
  });

  if (query.type) {
    filters.type = query.type;
  }

  if (query.category) {
    filters.category = query.category;
  }

  const dateRange = parseDateRange(query);
  if (dateRange) {
    filters.date = dateRange;
  }

  return filters;
};

const validateRecordPayload = ({ amount, type, category, date }, isPartial = false) => {
  if (!isPartial || amount !== undefined) {
    if (amount === undefined || Number.isNaN(Number(amount)) || Number(amount) < 0) {
      return 'Amount must be a number greater than or equal to 0';
    }
  }

  if (!isPartial || type !== undefined) {
    if (!FINANCIAL_RECORD_TYPES.includes(type)) {
      return 'Type must be either income or expense';
    }
  }

  if (!isPartial || category !== undefined) {
    if (!category || !String(category).trim()) {
      return 'Category is required';
    }
  }

  if (!isPartial || date !== undefined) {
    if (!date || Number.isNaN(new Date(date).getTime())) {
      return 'A valid date is required';
    }
  }

  return null;
};

const validateRecordFilters = (filters) => {
  if (filters.type && !FINANCIAL_RECORD_TYPES.includes(filters.type)) {
    return 'Invalid type filter';
  }

  if (hasInvalidDateRange(filters.date)) {
    return 'Invalid date filter';
  }

  if (filters.date?.$gte && filters.date?.$lte && filters.date.$gte > filters.date.$lte) {
    return 'dateFrom cannot be later than dateTo';
  }

  return null;
};

const ensureRecordPayloadHasUpdates = (body) => {
  const allowedFields = ['amount', 'type', 'category', 'date', 'notes', 'userId'];
  const hasUpdates = allowedFields.some((field) => body[field] !== undefined);

  if (!hasUpdates) {
    throw badRequest('At least one field is required to update a financial record');
  }
};

const canAccessRecord = ({ userRole, userId, record }) => {
  if (userRole === 'admin' || userRole === 'analyst') {
    return true;
  }

  return record.createdBy.toString() === userId;
};

const resolveRecordOwnerId = async ({ userRole, userId, requestedUserId }) => {
  if (userRole === 'viewer' || !requestedUserId) {
    return userId;
  }

  const targetUser = await getUserById(requestedUserId);
  return targetUser ? targetUser.id : null;
};

const createRecordData = ({ body, ownerId }) => ({
  amount: Number(body.amount),
  type: body.type,
  category: body.category,
  date: new Date(body.date),
  notes: body.notes || '',
  createdBy: ownerId
});

const applyRecordUpdates = async ({ record, body, userRole }) => {
  if (body.amount !== undefined) {
    record.amount = Number(body.amount);
  }

  if (body.type !== undefined) {
    record.type = body.type;
  }

  if (body.category !== undefined) {
    record.category = body.category;
  }

  if (body.date !== undefined) {
    record.date = new Date(body.date);
  }

  if (body.notes !== undefined) {
    record.notes = body.notes;
  }

  if (body.userId && userRole !== 'viewer') {
    const targetUser = await getUserById(body.userId);
    if (!targetUser) {
      return 'Target user not found';
    }

    record.createdBy = targetUser.id;
  }

  return null;
};

const findRecordById = (recordId) => FinancialRecord.findById(recordId);

const findRecordWithOwnerById = (recordId) => (
  FinancialRecord.findById(recordId).populate('createdBy', 'name email role')
);

const listRecords = (filters) => (
  FinancialRecord.find(filters)
    .populate('createdBy', 'name email role')
    .sort({ date: -1, createdAt: -1 })
);

module.exports = {
  applyRecordUpdates,
  buildRecordAccessScope,
  buildRecordFilters,
  canAccessRecord,
  createRecordData,
  ensureRecordPayloadHasUpdates,
  findRecordById,
  findRecordWithOwnerById,
  hasInvalidDateRange,
  listRecords,
  parseDateRange,
  resolveRecordOwnerId,
  validateRecordFilters,
  validateRecordPayload
};
