const {
  buildDashboardMatch,
  getDashboardSummary,
  validateDashboardFilters
} = require('../services/dashboardService');
const { badRequest } = require('../utils/errorResponses');
const { validateDashboardQuery } = require('../validators/dashboardValidator');

exports.getSummary = async (req, res, next) => {
  try {
    const match = buildDashboardMatch({
      userRole: req.userRole,
      userId: req.user.id,
      query: req.query
    });
    const filterError = validateDashboardFilters(match);
    if (filterError) {
      throw badRequest(filterError);
    }

    const period = validateDashboardQuery(req.query);
    const summary = await getDashboardSummary({ match, period });

    res.status(200).json({
      filters: req.query,
      ...summary
    });
  } catch (error) {
    next(error);
  }
};
