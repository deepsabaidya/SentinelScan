const { assessCookies, parseCookie } = require('../assessments/cookieAssessment');

describe('Cookie Security Assessment Module', () => {
  describe('parseCookie', () => {
    test('parses cookie flags accurately', () => {
      const raw = 'sessionId=xyz123; Secure; HttpOnly; SameSite=Strict; Path=/; Domain=.example.com';
      const parsed = parseCookie(raw);

      expect(parsed.name).toBe('sessionId');
      expect(parsed.secure).toBe(true);
      expect(parsed.httpOnly).toBe(true);
      expect(parsed.sameSite).toBe('Strict');
      expect(parsed.path).toBe('/');
      expect(parsed.domain).toBe('.example.com');
    });

    test('handles missing security flags', () => {
      const raw = 'tracker_id=abc999; Path=/';
      const parsed = parseCookie(raw);

      expect(parsed.name).toBe('tracker_id');
      expect(parsed.secure).toBe(false);
      expect(parsed.httpOnly).toBe(false);
      expect(parsed.sameSite).toBeNull();
    });
  });

  describe('assessCookies', () => {
    test('passes when no cookies are set', () => {
      const result = assessCookies([]);
      expect(result.checks.length).toBe(1);
      expect(result.checks[0].result).toBe('passed');
      expect(result.findings.length).toBe(0);
    });

    test('flags missing Secure and HttpOnly flags on cookies', () => {
      const result = assessCookies(['auth_token=supersecret; Path=/']);
      expect(result.checks[0].result).toBe('warning');

      const findingTitles = result.findings.map((f) => f.title);
      expect(findingTitles.some((t) => t.includes('Missing "Secure" Flag'))).toBe(true);
      expect(findingTitles.some((t) => t.includes('Missing "HttpOnly" Flag'))).toBe(true);
      expect(findingTitles.some((t) => t.includes('Missing "SameSite" Attribute'))).toBe(true);
    });

    test('passes without findings when all cookies are properly secured', () => {
      const result = assessCookies([
        'session=safe123; Secure; HttpOnly; SameSite=Lax; Path=/',
      ]);
      expect(result.checks[0].result).toBe('passed');
      expect(result.findings.length).toBe(0);
    });
  });
});
