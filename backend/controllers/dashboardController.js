const Website = require('../models/Website');
const Assessment = require('../models/Assessment');
const Finding = require('../models/Finding');

/**
 * @desc    Get dashboard statistics for the logged-in user
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totalWebsites, assessments, latestAssessment] = await Promise.all([
      Website.countDocuments({ userId }),
      Assessment.find({ userId, status: 'completed' }).select('securityScore summary createdAt websiteId'),
      Assessment.findOne({ userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .populate('websiteId', 'domain url'),
    ]);

    const totalAssessments = assessments.length;

    // Calculate Average Score
    const averageScore =
      totalAssessments > 0
        ? Math.round(
            assessments.reduce((acc, curr) => acc + (curr.securityScore || 0), 0) /
              totalAssessments
          )
        : 0;

    // Aggregate Severity totals from completed assessments
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let informationalCount = 0;

    for (const a of assessments) {
      if (a.summary) {
        criticalCount += a.summary.critical || 0;
        highCount += a.summary.high || 0;
        mediumCount += a.summary.medium || 0;
        lowCount += a.summary.low || 0;
        informationalCount += a.summary.informational || 0;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalWebsites,
        totalAssessments,
        averageScore,
        criticalFindings: criticalCount,
        highFindings: highCount,
        mediumFindings: mediumCount,
        lowFindings: lowCount,
        informationalFindings: informationalCount,
        latestAssessment: latestAssessment || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get assessment score history for timeline Chart.js visualization
 * @route   GET /api/dashboard/history
 * @access  Private
 */
const getDashboardHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const assessments = await Assessment.find({ userId, status: 'completed' })
      .sort({ createdAt: 1 })
      .limit(30)
      .select('securityScore securityGrade targetDomain targetUrl createdAt completedAt');

    const history = assessments.map((a) => ({
      id: a._id,
      score: a.securityScore,
      grade: a.securityGrade,
      domain: a.targetDomain,
      date: a.completedAt || a.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: { history },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get findings distribution grouped by severity for Chart.js doughnut
 * @route   GET /api/dashboard/severity
 * @access  Private
 */
const getSeverityDistribution = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all completed assessment IDs belonging to this user
    const assessments = await Assessment.find({ userId, status: 'completed' }).select('_id');
    const assessmentIds = assessments.map((a) => a._id);

    if (assessmentIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          distribution: {
            Critical: 0,
            High: 0,
            Medium: 0,
            Low: 0,
            Informational: 0,
          },
        },
      });
    }

    const aggregation = await Finding.aggregate([
      { $match: { assessmentId: { $in: assessmentIds } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const distribution = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
      Informational: 0,
    };

    aggregation.forEach((item) => {
      if (item._id && distribution[item._id] !== undefined) {
        distribution[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: { distribution },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDashboardHistory,
  getSeverityDistribution,
};
