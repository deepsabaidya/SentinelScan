const { isPrivateIPv4, isPrivateIPv6, validateTargetUrl } = require('../utils/ssrfValidator');

describe('SSRF & URL Security Validator', () => {
  describe('isPrivateIPv4', () => {
    test('identifies loopback addresses as private/unsafe', () => {
      expect(isPrivateIPv4('127.0.0.1')).toBe(true);
      expect(isPrivateIPv4('127.0.1.1')).toBe(true);
    });

    test('identifies RFC 1918 private subnets as unsafe', () => {
      expect(isPrivateIPv4('10.0.0.1')).toBe(true);
      expect(isPrivateIPv4('172.16.0.1')).toBe(true);
      expect(isPrivateIPv4('172.31.255.255')).toBe(true);
      expect(isPrivateIPv4('192.168.1.1')).toBe(true);
    });

    test('identifies cloud metadata service IP 169.254.169.254 as unsafe', () => {
      expect(isPrivateIPv4('169.254.169.254')).toBe(true);
      expect(isPrivateIPv4('169.254.1.1')).toBe(true);
    });

    test('allows legitimate public IPv4 addresses', () => {
      expect(isPrivateIPv4('8.8.8.8')).toBe(false);
      expect(isPrivateIPv4('1.1.1.1')).toBe(false);
      expect(isPrivateIPv4('142.250.190.46')).toBe(false);
    });
  });

  describe('isPrivateIPv6', () => {
    test('identifies loopback and unspecified IPv6 as unsafe', () => {
      expect(isPrivateIPv6('::1')).toBe(true);
      expect(isPrivateIPv6('::')).toBe(true);
    });

    test('identifies unique local (ULA) and link-local IPv6 as unsafe', () => {
      expect(isPrivateIPv6('fc00::1')).toBe(true);
      expect(isPrivateIPv6('fe80::1')).toBe(true);
    });
  });

  describe('validateTargetUrl', () => {
    test('rejects non-HTTP/HTTPS protocols', async () => {
      const res = await validateTargetUrl('file:///etc/passwd');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/prohibited|invalid/i);
    });

    test('rejects localhost and metadata domains', async () => {
      const res1 = await validateTargetUrl('http://localhost:3000');
      expect(res1.valid).toBe(false);

      const res2 = await validateTargetUrl('http://169.254.169.254/latest/meta-data/');
      expect(res2.valid).toBe(false);
    });

    test('rejects URLs with embedded user credentials', async () => {
      const res = await validateTargetUrl('http://admin:secret@example.com');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/credentials/i);
    });
  });
});
