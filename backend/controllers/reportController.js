const Assessment = require('../models/Assessment');
const Finding = require('../models/Finding');
const AssessmentCheck = require('../models/AssessmentCheck');
const { generatePDFReport } = require('../services/pdfReportService');

/**
 * @desc    Generate and download official PDF security assessment report
 * @route   GET /api/reports/:assessmentId/pdf
 * @access  Private
 */
const downloadPDFReport = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      userId: req.user._id,
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or access denied.',
      });
    }

    const [findings, checks] = await Promise.all([
      Finding.find({ assessmentId: assessment._id }).sort({ severity: 1 }),
      AssessmentCheck.find({ assessmentId: assessment._id }),
    ]);

    const filename = `SentinelScan-Report-${assessment.targetDomain}-${assessment._id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generatePDFReport(assessment, findings, checks, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export assessment findings to CSV format
 * @route   GET /api/reports/:assessmentId/csv
 * @access  Private
 */
const downloadCSVReport = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      userId: req.user._id,
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or access denied.',
      });
    }

    const findings = await Finding.find({ assessmentId: assessment._id }).sort({ severity: 1 });

    // Escape CSV cell helper
    const escapeCsv = (str) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = [
      'Assessment ID',
      'Target Domain',
      'Category',
      'Finding Title',
      'Severity',
      'Description',
      'Evidence',
      'Remediation Recommendation',
      'Status',
      'Date Identified',
    ];

    const rows = findings.map((f) => [
      escapeCsv(assessment._id),
      escapeCsv(assessment.targetDomain),
      escapeCsv(f.category),
      escapeCsv(f.title),
      escapeCsv(f.severity),
      escapeCsv(f.description),
      escapeCsv(f.evidence),
      escapeCsv(f.recommendation),
      escapeCsv(f.status),
      escapeCsv(f.createdAt ? new Date(f.createdAt).toISOString() : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const filename = `SentinelScan-Findings-${assessment.targetDomain}-${assessment._id}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  downloadPDFReport,
  downloadCSVReport,
};
