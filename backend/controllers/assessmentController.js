const Assessment = require('../models/Assessment');
const Finding = require('../models/Finding');
const AssessmentCheck = require('../models/AssessmentCheck');
const Website = require('../models/Website');
const { runAssessment } = require('../assessments/assessmentRunner');

/**
 * @desc    Launch a new security assessment for a registered website
 * @route   POST /api/assessments
 * @access  Private
 */
const createAssessment = async (req, res, next) => {
  try {
    const { websiteId } = req.body;

    if (!websiteId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid websiteId.',
      });
    }

    // Verify website exists and belongs to requesting user
    const website = await Website.findOne({ _id: websiteId, userId: req.user._id });
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found or unauthorized to assess this target.',
      });
    }

    // Run passive assessment pipeline
    const result = await runAssessment(websiteId, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Security assessment completed successfully.',
      data: {
        assessment: result.assessment,
        findingsCount: result.findings.length,
        checksCount: result.checks.length,
        securityScore: result.assessment.securityScore,
        securityGrade: result.assessment.securityGrade,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all assessments for the logged-in user
 * @route   GET /api/assessments
 * @access  Private
 */
const getAssessments = async (req, res, next) => {
  try {
    const { websiteId, limit = 50 } = req.query;
    const query = { userId: req.user._id };

    if (websiteId) {
      query.websiteId = websiteId;
    }

    const assessments = await Assessment.find(query)
      .populate('websiteId', 'url domain')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: assessments.length,
      data: { assessments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete assessment details, findings, and technical checks
 * @route   GET /api/assessments/:id
 * @access  Private
 */
const getAssessmentById = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('websiteId', 'url domain lastScore lastGrade');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or access denied.',
      });
    }

    const [findings, checks] = await Promise.all([
      Finding.find({ assessmentId: assessment._id }).sort({
        // Sort Critical first, then High, Medium, Low, Informational
        severity: 1,
      }),
      AssessmentCheck.find({ assessmentId: assessment._id }).sort({ checkName: 1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        assessment,
        findings,
        checks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an assessment record and its associated findings and checks
 * @route   DELETE /api/assessments/:id
 * @access  Private
 */
const deleteAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment record not found or access denied.',
      });
    }

    await Finding.deleteMany({ assessmentId: assessment._id });
    await AssessmentCheck.deleteMany({ assessmentId: assessment._id });
    await Assessment.deleteOne({ _id: assessment._id });

    res.status(200).json({
      success: true,
      message: 'Assessment record and findings deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  deleteAssessment,
};
