/**
 * SentinelScan Master Assessment Orchestrator
 * Safely executes all assessment modules, aggregates findings, and persists to MongoDB Atlas
 */
const { validateTargetUrl } = require('../utils/ssrfValidator');
const { assessHeaders } = require('./headerAssessment');
const { assessTLS } = require('./tlsAssessment');
const { assessHTTPS } = require('./httpsAssessment');
const { assessDNS } = require('./dnsAssessment');
const { assessCookies } = require('./cookieAssessment');
const { calculateScore } = require('./scoringEngine');

const Assessment = require('../models/Assessment');
const Finding = require('../models/Finding');
const AssessmentCheck = require('../models/AssessmentCheck');
const Website = require('../models/Website');

/**
 * Run a full passive security assessment on target website
 * @param {string} websiteId - MongoDB ObjectId of registered Website
 * @param {string} userId - MongoDB ObjectId of user
 * @returns {Promise<object>} - Assessment result with findings & checks
 */
async function runAssessment(websiteId, userId) {
  // 1. Fetch website and verify ownership
  const website = await Website.findOne({ _id: websiteId, userId });
  if (!website) {
    throw new Error('Target website not found or unauthorized access.');
  }

  // 2. Validate target URL and re-verify public IP to prevent SSRF and DNS rebinding
  const validation = await validateTargetUrl(website.url);
  if (!validation.valid) {
    throw new Error(`SSRF Security Guard blocked assessment: ${validation.error}`);
  }

  const domain = validation.domain;
  const targetUrl = validation.normalizedUrl;

  // 3. Create initial assessment record in MongoDB Atlas (status: in_progress)
  const assessment = await Assessment.create({
    userId,
    websiteId: website._id,
    targetUrl,
    targetDomain: domain,
    status: 'in_progress',
    startedAt: new Date(),
  });

  try {
    // 4. Run all passive assessment modules concurrently for performance
    const [headerResult, tlsResult, httpsResult, dnsResult] = await Promise.all([
      assessHeaders(targetUrl).catch((err) => ({
        checks: [{ checkName: 'HTTP Headers', category: 'headers', result: 'unable_to_assess', details: { error: err.message } }],
        findings: [],
        rawHeaders: {},
        cookies: [],
      })),
      assessTLS(domain).catch((err) => ({
        checks: [{ checkName: 'SSL/TLS Assessment', category: 'ssl_tls', result: 'unable_to_assess', details: { error: err.message } }],
        findings: [],
        tlsDetails: null,
      })),
      assessHTTPS(domain).catch((err) => ({
        checks: [{ checkName: 'HTTPS Redirection', category: 'https', result: 'unable_to_assess', details: { error: err.message } }],
        findings: [],
        details: {},
      })),
      assessDNS(domain).catch((err) => ({
        checks: [{ checkName: 'DNS Analysis', category: 'dns', result: 'unable_to_assess', details: { error: err.message } }],
        findings: [],
        dnsDetails: {},
      })),
    ]);

    // 5. Evaluate cookie security from collected headers
    const cookieResult = assessCookies(headerResult.cookies || []);

    // 6. Aggregate all checks and findings
    const allChecks = [
      ...headerResult.checks,
      ...tlsResult.checks,
      ...httpsResult.checks,
      ...dnsResult.checks,
      ...cookieResult.checks,
    ];

    const allFindings = [
      ...headerResult.findings,
      ...tlsResult.findings,
      ...httpsResult.findings,
      ...dnsResult.findings,
      ...cookieResult.findings,
    ];

    // 7. Calculate final security score and grade
    const scoring = calculateScore(allChecks, allFindings);

    // 8. Bulk insert findings into MongoDB Atlas
    const findingDocs = allFindings.map((f) => ({
      assessmentId: assessment._id,
      category: f.category,
      title: f.title,
      description: f.description,
      severity: f.severity,
      evidence: f.evidence || '',
      recommendation: f.recommendation,
      status: 'open',
    }));

    if (findingDocs.length > 0) {
      await Finding.insertMany(findingDocs);
    }

    // 9. Bulk insert assessment checks into MongoDB Atlas
    const checkDocs = allChecks.map((c) => ({
      assessmentId: assessment._id,
      checkName: c.checkName,
      category: c.category || 'general',
      result: c.result,
      status: 'completed',
      scoreImpact: c.scoreImpact || 0,
      details: c.details || {},
    }));

    if (checkDocs.length > 0) {
      await AssessmentCheck.insertMany(checkDocs);
    }

    // 10. Update Assessment record with final results
    assessment.status = 'completed';
    assessment.completedAt = new Date();
    assessment.securityScore = scoring.score;
    assessment.securityGrade = scoring.grade;
    assessment.summary = {
      totalFindings: scoring.counts.totalFindings,
      critical: scoring.counts.critical,
      high: scoring.counts.high,
      medium: scoring.counts.medium,
      low: scoring.counts.low,
      informational: scoring.counts.informational,
      passedChecks: scoring.counts.passedChecks,
      failedChecks: scoring.counts.failedChecks,
      warningChecks: scoring.counts.warningChecks,
      unableToAssess: scoring.counts.unableToAssess,
    };
    await assessment.save();

    // 11. Update Website record with latest assessment metadata
    website.lastScore = scoring.score;
    website.lastGrade = scoring.grade;
    website.lastAssessedAt = assessment.completedAt;
    await website.save();

    return {
      assessment,
      findings: findingDocs,
      checks: checkDocs,
      scoring,
      tlsDetails: tlsResult.tlsDetails,
      dnsDetails: dnsResult.dnsDetails,
    };
  } catch (error) {
    // If unexpected failure occurs, record failed status
    assessment.status = 'failed';
    assessment.errorMessage = error.message;
    assessment.completedAt = new Date();
    await assessment.save();
    throw error;
  }
}

module.exports = {
  runAssessment,
};
