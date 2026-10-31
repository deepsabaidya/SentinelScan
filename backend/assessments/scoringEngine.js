/**
 * Transparent Security Scoring Engine
 * Computes deterministic, auditable security score (0 - 100) and grade assignment
 * 
 * Rules:
 * - 90–100: Excellent
 * - 75–89: Good
 * - 60–74: Moderate
 * - 40–59: Needs Improvement
 * - 0–39: Poor
 */

/**
 * Assign grade based on score according to strict criteria
 * @param {number} score 
 * @returns {'Excellent' | 'Good' | 'Moderate' | 'Needs Improvement' | 'Poor'}
 */
function getSecurityGrade(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Calculate security score from checks and findings
 * @param {Array} checks - All executed assessment checks
 * @param {Array} findings - Generated security findings
 * @returns {{ score: number, grade: string, breakdown: object }}
 */
function calculateScore(checks = [], findings = []) {
  // Base weights for categories (Total = 100 pts)
  // 1. Headers: 30 pts
  // 2. SSL/TLS & HTTPS: 35 pts
  // 3. Cookies: 15 pts
  // 4. DNS: 20 pts

  let headerScore = 30;
  let tlsScore = 35;
  let cookieScore = 15;
  let dnsScore = 20;

  // Track check outcomes
  let passedCount = 0;
  let failedCount = 0;
  let warningCount = 0;
  let unableCount = 0;

  for (const check of checks) {
    if (check.result === 'passed') {
      passedCount++;
    } else if (check.result === 'failed') {
      failedCount++;
      const penalty = Math.abs(check.scoreImpact || 5);
      if (check.category === 'headers') headerScore = Math.max(0, headerScore - penalty);
      else if (check.category === 'ssl_tls' || check.category === 'https') tlsScore = Math.max(0, tlsScore - penalty);
      else if (check.category === 'cookies') cookieScore = Math.max(0, cookieScore - penalty);
      else if (check.category === 'dns') dnsScore = Math.max(0, dnsScore - penalty);
    } else if (check.result === 'warning') {
      warningCount++;
      const penalty = Math.abs(check.scoreImpact || 2);
      if (check.category === 'headers') headerScore = Math.max(0, headerScore - penalty);
      else if (check.category === 'ssl_tls' || check.category === 'https') tlsScore = Math.max(0, tlsScore - penalty);
      else if (check.category === 'cookies') cookieScore = Math.max(0, cookieScore - penalty);
      else if (check.category === 'dns') dnsScore = Math.max(0, dnsScore - penalty);
    } else if (check.result === 'unable_to_assess') {
      unableCount++;
      // Unavailable checks do NOT receive full credit; reduce category baseline proportionately
      if (check.category === 'headers') headerScore = Math.max(0, headerScore - 10);
      else if (check.category === 'ssl_tls' || check.category === 'https') tlsScore = Math.max(0, tlsScore - 15);
      else if (check.category === 'cookies') cookieScore = Math.max(0, cookieScore - 5);
      else if (check.category === 'dns') dnsScore = Math.max(0, dnsScore - 5);
    }
  }

  // Count findings by severity
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };

  for (const finding of findings) {
    const sev = (finding.severity || '').toLowerCase();
    if (sev === 'critical') counts.critical++;
    else if (sev === 'high') counts.high++;
    else if (sev === 'medium') counts.medium++;
    else if (sev === 'low') counts.low++;
    else if (sev === 'informational') counts.informational++;
  }

  // Raw calculated score from category totals
  let rawScore = headerScore + tlsScore + cookieScore + dnsScore;

  // Apply critical findings ceiling:
  // If there are Critical findings (e.g. invalid/expired cert, untrusted chain), score cannot exceed 45 ('Needs Improvement' / 'Poor')
  if (counts.critical > 0) {
    rawScore = Math.min(rawScore, 45 - (counts.critical - 1) * 10);
  } else if (counts.high >= 3) {
    // If 3 or more High findings, score cannot exceed 65 ('Moderate')
    rawScore = Math.min(rawScore, 65);
  }

  // Bound score strictly between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const grade = getSecurityGrade(finalScore);

  return {
    score: finalScore,
    grade,
    breakdown: {
      headers: Math.round(headerScore),
      tlsAndHttps: Math.round(tlsScore),
      cookies: Math.round(cookieScore),
      dns: Math.round(dnsScore),
    },
    counts: {
      ...counts,
      totalFindings: findings.length,
      passedChecks: passedCount,
      failedChecks: failedCount,
      warningChecks: warningCount,
      unableToAssess: unableCount,
    },
  };
}

module.exports = {
  calculateScore,
  getSecurityGrade,
};
