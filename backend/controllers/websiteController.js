const Website = require('../models/Website');
const Assessment = require('../models/Assessment');
const Finding = require('../models/Finding');
const AssessmentCheck = require('../models/AssessmentCheck');
const { validateTargetUrl } = require('../utils/ssrfValidator');

/**
 * @desc    Get all websites owned by logged-in user
 * @route   GET /api/websites
 * @access  Private
 */
const getWebsites = async (req, res, next) => {
  try {
    const websites = await Website.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: websites.length,
      data: { websites },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new website for assessment
 * @route   POST /api/websites
 * @access  Private
 */
const registerWebsite = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid website URL.',
      });
    }

    // SSRF & Target Security Validation
    const validation = await validateTargetUrl(url);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error || 'The provided URL is invalid or target resolution failed.',
      });
    }

    // Prevent duplicate website registrations for same user
    const existing = await Website.findOne({
      userId: req.user._id,
      domain: validation.domain,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `The domain '${validation.domain}' is already registered in your portfolio.`,
        data: { website: existing },
      });
    }

    const website = await Website.create({
      userId: req.user._id,
      url: validation.normalizedUrl,
      domain: validation.domain,
    });

    res.status(201).json({
      success: true,
      message: 'Website registered successfully.',
      data: { website },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a registered website and its assessment history
 * @route   DELETE /api/websites/:id
 * @access  Private
 */
const deleteWebsite = async (req, res, next) => {
  try {
    const website = await Website.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found or you are not authorized to delete it.',
      });
    }

    // Find all assessment IDs associated with this website to cascade delete
    const assessments = await Assessment.find({ websiteId: website._id }).select('_id');
    const assessmentIds = assessments.map((a) => a._id);

    if (assessmentIds.length > 0) {
      await Finding.deleteMany({ assessmentId: { $in: assessmentIds } });
      await AssessmentCheck.deleteMany({ assessmentId: { $in: assessmentIds } });
      await Assessment.deleteMany({ _id: { $in: assessmentIds } });
    }

    await Website.deleteOne({ _id: website._id });

    res.status(200).json({
      success: true,
      message: 'Website and all associated assessment records deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWebsites,
  registerWebsite,
  deleteWebsite,
};
