const { calculateScore, getSecurityGrade } = require('../assessments/scoringEngine');

describe('Security Scoring Engine', () => {
  describe('getSecurityGrade', () => {
    test('assigns correct grades based on thresholds', () => {
      expect(getSecurityGrade(95)).toBe('Excellent');
      expect(getSecurityGrade(90)).toBe('Excellent');
      expect(getSecurityGrade(85)).toBe('Good');
      expect(getSecurityGrade(75)).toBe('Good');
      expect(getSecurityGrade(70)).toBe('Moderate');
      expect(getSecurityGrade(60)).toBe('Moderate');
      expect(getSecurityGrade(50)).toBe('Needs Improvement');
      expect(getSecurityGrade(40)).toBe('Needs Improvement');
      expect(getSecurityGrade(35)).toBe('Poor');
      expect(getSecurityGrade(0)).toBe('Poor');
    });
  });

  describe('calculateScore', () => {
    test('calculates a 100 Excellent score when all checks pass and 0 findings', () => {
      const checks = [
        { category: 'headers', result: 'passed', scoreImpact: 0 },
        { category: 'ssl_tls', result: 'passed', scoreImpact: 0 },
        { category: 'https', result: 'passed', scoreImpact: 0 },
        { category: 'cookies', result: 'passed', scoreImpact: 0 },
        { category: 'dns', result: 'passed', scoreImpact: 0 },
      ];
      const findings = [];

      const result = calculateScore(checks, findings);
      expect(result.score).toBe(100);
      expect(result.grade).toBe('Excellent');
      expect(result.counts.totalFindings).toBe(0);
    });

    test('caps score at or below 45 when Critical findings are present', () => {
      const checks = [
        { category: 'ssl_tls', result: 'failed', scoreImpact: -15 },
      ];
      const findings = [
        {
          category: 'ssl_tls',
          title: 'Untrusted SSL/TLS Certificate',
          severity: 'Critical',
        },
      ];

      const result = calculateScore(checks, findings);
      expect(result.score).toBeLessThanOrEqual(45);
      expect(['Needs Improvement', 'Poor']).toContain(result.grade);
      expect(result.counts.critical).toBe(1);
    });

    test('deducts appropriate points for failed and warning checks', () => {
      const checks = [
        { category: 'headers', result: 'failed', scoreImpact: -8 }, // missing CSP
        { category: 'headers', result: 'warning', scoreImpact: -2 }, // short HSTS
      ];
      const findings = [
        { category: 'headers', severity: 'High', title: 'Missing CSP' },
        { category: 'headers', severity: 'Low', title: 'Short HSTS' },
      ];

      const result = calculateScore(checks, findings);
      expect(result.score).toBeLessThan(100);
      expect(result.counts.high).toBe(1);
      expect(result.counts.low).toBe(1);
    });

    test('does not grant full points when checks are unable_to_assess', () => {
      const checks = [
        { category: 'headers', result: 'unable_to_assess' },
        { category: 'ssl_tls', result: 'unable_to_assess' },
      ];
      const result = calculateScore(checks, []);
      expect(result.score).toBeLessThan(80);
      expect(result.counts.unableToAssess).toBe(2);
    });
  });
});
