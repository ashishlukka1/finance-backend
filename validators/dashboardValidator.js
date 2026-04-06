const { badRequest } = require('../utils/errorResponses');

const VALID_DASHBOARD_PERIODS = ['monthly', 'weekly'];

const validateDashboardQuery = (query) => {
  if (!query.period) {
    return 'monthly';
  }

  if (!VALID_DASHBOARD_PERIODS.includes(query.period)) {
    throw badRequest('Period must be either monthly or weekly');
  }

  return query.period;
};

module.exports = {
  VALID_DASHBOARD_PERIODS,
  validateDashboardQuery
};
