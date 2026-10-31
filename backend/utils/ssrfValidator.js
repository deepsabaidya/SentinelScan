const dns = require('dns').promises;
const url = require('url');

/**
 * Check if an IPv4 address is in private, reserved, loopback, or cloud metadata ranges.
 * @param {string} ip - IPv4 string (e.g. "127.0.0.1")
 * @returns {boolean} - true if private/unsafe, false if safe public IP
 */
function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed is treated as unsafe
  }

  const [p0, p1, p2, p3] = parts;

  // 0.0.0.0/8 (Current network)
  if (p0 === 0) return true;

  // 10.0.0.0/8 (Private network)
  if (p0 === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (p0 === 127) return true;

  // 100.64.0.0/10 (Carrier-Grade NAT)
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;

  // 169.254.0.0/16 (Link-Local & Cloud Metadata e.g. AWS/Azure/GCP 169.254.169.254)
  if (p0 === 169 && p1 === 254) return true;

  // 172.16.0.0/12 (Private network: 172.16.0.0 - 172.31.255.255)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (p0 === 192 && p1 === 0 && p2 === 0) return true;

  // 192.0.2.0/24 (Documentation - TEST-NET-1)
  if (p0 === 192 && p1 === 0 && p2 === 2) return true;

  // 192.168.0.0/16 (Private network)
  if (p0 === 192 && p1 === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (p0 === 198 && (p1 === 18 || p1 === 19)) return true;

  // 198.51.100.0/24 (Documentation - TEST-NET-2)
  if (p0 === 198 && p1 === 51 && p2 === 100) return true;

  // 203.0.113.0/24 (Documentation - TEST-NET-3)
  if (p0 === 203 && p1 === 0 && p2 === 113) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (p0 >= 224) return true;

  // 255.255.255.255 (Broadcast)
  if (p0 === 255 && p1 === 255 && p2 === 255 && p3 === 255) return true;

  return false;
}

/**
 * Check if an IPv6 address is in private, loopback, or link-local ranges.
 * @param {string} ip - IPv6 string
 * @returns {boolean} - true if private/unsafe
 */
function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();

  // Loopback (::1) and Unspecified (::)
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 (::ffff:192.168.1.1 or ::ffff:c0a8:0101)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.replace('::ffff:', '');
    if (ipv4Part.includes('.')) {
      return isPrivateIPv4(ipv4Part);
    }
  }

  // Unique Local Address (ULA) fc00::/7 (fc00 to fdff)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-Local fe80::/10 (fe80 to febf)
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true;
  }

  // Discard prefix 100::/64
  if (normalized.startsWith('100::')) return true;

  // Documentation 2001:db8::/32
  if (normalized.startsWith('2001:db8') || normalized.startsWith('2001:0db8')) return true;

  return false;
}

/**
 * Validates a target URL against SSRF, private networks, DNS rebinding, and invalid protocols.
 * @param {string} inputUrl - The URL provided by the user
 * @returns {Promise<{ valid: boolean, normalizedUrl: string, domain: string, resolvedIps: string[], error?: string }>}
 */
async function validateTargetUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'Target URL is required.' };
  }

  let raw = inputUrl.trim();
  // If the input has no URI scheme (like example.com), prepend https://
  // If it already has an explicit scheme (e.g. file:, ftp:, http:, https:), preserve it so invalid schemes can be rejected
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(raw) && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(raw)) {
    raw = 'https://' + raw;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch (err) {
    return { valid: false, error: 'Invalid URL format.' };
  }

  // Only permit HTTP and HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      error: `Protocol '${parsed.protocol}' is prohibited. Only HTTP and HTTPS are permitted.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block credentials in URL (e.g. http://user:pass@example.com)
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'URLs with embedded user credentials are not permitted.' };
  }

  // Explicit blacklist of dangerous hostnames
  const forbiddenHostnames = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '169.254.169.254',
    'metadata.google.internal',
    'instance-data',
  ];
  if (
    forbiddenHostnames.includes(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return {
      valid: false,
      error: 'Security Violation: Access to local, internal, or metadata hostnames is strictly blocked.',
    };
  }

  // Check if hostname is an IPv4 or IPv6 directly
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return {
        valid: false,
        error: `Security Violation: IP address '${hostname}' belongs to a private/reserved network range.`,
      };
    }
  }

  try {
    const dnsLookupPromise = dns.lookup(hostname, { all: true });
    const timeoutPromise = new Promise((_, reject) => {
      const timer = setTimeout(() => reject(new Error(`DNS resolution timed out after 3000ms for '${hostname}'`)), 3000);
      if (timer.unref) timer.unref();
    });
    const addresses = await Promise.race([dnsLookupPromise, timeoutPromise]);

    if (!addresses || addresses.length === 0) {
      return {
        valid: false,
        error: `Unable to resolve host '${hostname}'. Host does not exist or DNS is unreachable.`,
      };
    }

    const resolvedIps = [];

    for (const record of addresses) {
      const ip = record.address;
      resolvedIps.push(ip);

      if (record.family === 4) {
        if (isPrivateIPv4(ip)) {
          return {
            valid: false,
            error: `Security Violation: Host '${hostname}' resolves to private/internal IP address (${ip}). Request blocked.`,
          };
        }
      } else if (record.family === 6) {
        if (isPrivateIPv6(ip)) {
          return {
            valid: false,
            error: `Security Violation: Host '${hostname}' resolves to private/internal IPv6 address (${ip}). Request blocked.`,
          };
        }
      }
    }

    // Normalized standard URL: scheme + domain + (port if non-standard)
    const normalizedUrl = `${parsed.protocol}//${parsed.host}`;

    return {
      valid: true,
      normalizedUrl,
      domain: hostname,
      resolvedIps,
    };
  } catch (dnsErr) {
    return {
      valid: false,
      error: `DNS resolution failed for '${hostname}': ${dnsErr.message}`,
    };
  }
}

module.exports = {
  validateTargetUrl,
  isPrivateIPv4,
  isPrivateIPv6,
};
