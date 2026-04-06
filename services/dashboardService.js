const FinancialRecord = require('../models/FinancialRecord');
const {
  buildRecordAccessScope,
  hasInvalidDateRange,
  parseDateRange
} = require('./financialRecordService');

const buildDashboardMatch = ({ userRole, userId, query }) => {
  const match = buildRecordAccessScope({
    userRole,
    userId,
    scopedUserId: query.userId
  });

  const dateRange = parseDateRange(query);
  if (dateRange) {
    match.date = dateRange;
  }

  return match;
};

const getTrendGroupStage = (period) => {
  if (period === 'weekly') {
    return {
      year: { $isoWeekYear: '$date' },
      period: { $isoWeek: '$date' },
      label: {
        $concat: [
          { $toString: { $isoWeekYear: '$date' } },
          '-W',
          { $toString: { $isoWeek: '$date' } }
        ]
      }
    };
  }

  return {
    year: { $year: '$date' },
    period: { $month: '$date' },
    label: { $dateToString: { format: '%Y-%m', date: '$date' } }
  };
};

const validateDashboardFilters = (match) => (
  hasInvalidDateRange(match.date) ? 'Invalid date filter' : null
);

const getDashboardSummary = async ({ match, period }) => {
  const trendGroup = getTrendGroupStage(period);

  const overviewPipeline = [
    { $match: match },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        totalExpenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        },
        totalRecords: { $sum: 1 }
      }
    }
  ];

  const categoryPipeline = [
    { $match: match },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        type: '$_id.type',
        total: 1,
        count: 1
      }
    },
    { $sort: { total: -1, category: 1 } }
  ];

  const recentActivityPipeline = [
    { $match: match },
    { $sort: { date: -1, createdAt: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdBy'
      }
    },
    {
      $project: {
        amount: 1,
        type: 1,
        category: 1,
        date: 1,
        notes: 1,
        createdAt: 1,
        createdBy: {
          $let: {
            vars: { owner: { $arrayElemAt: ['$createdBy', 0] } },
            in: {
              _id: '$$owner._id',
              name: '$$owner.name',
              email: '$$owner.email',
              role: '$$owner.role'
            }
          }
        }
      }
    }
  ];

  const trendPipeline = [
    { $match: match },
    {
      $group: {
        _id: trendGroup,
        income: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        label: '$_id.label',
        year: '$_id.year',
        period: '$_id.period',
        income: 1,
        expenses: 1,
        netBalance: { $subtract: ['$income', '$expenses'] }
      }
    },
    { $sort: { year: 1, period: 1 } }
  ];

  const [overviewResult, categoryTotals, recentActivity, trends] = await Promise.all([
    FinancialRecord.aggregate(overviewPipeline),
    FinancialRecord.aggregate(categoryPipeline),
    FinancialRecord.aggregate(recentActivityPipeline),
    FinancialRecord.aggregate(trendPipeline)
  ]);

  const overview = overviewResult[0] || {
    totalIncome: 0,
    totalExpenses: 0,
    totalRecords: 0
  };

  return {
    overview: {
      totalIncome: overview.totalIncome,
      totalExpenses: overview.totalExpenses,
      netBalance: overview.totalIncome - overview.totalExpenses,
      totalRecords: overview.totalRecords
    },
    categoryTotals,
    recentActivity,
    trends
  };
};

module.exports = {
  buildDashboardMatch,
  getDashboardSummary,
  validateDashboardFilters
};
