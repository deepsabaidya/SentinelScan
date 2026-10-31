/**
 * HTTP Security Headers Assessment Module
 * Passive analysis of critical browser defense headers
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Fetch HTTP headers with custom redirect handling and timeout
 * @param {string} targetUrl 
 * @param {number} timeoutMs 
 * @returns {Promise<{ headers: object, statusCode: number, finalUrl: string, cookies: string[] }>}
 */
function fetchHeaders(targetUrl, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.request(
        parsed,
        {
          method: 'GET',
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SentinelScan-Audit-Engine/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        },
        (res) => {
          const rawHeaders = res.headers;
          const setCookieHeaders = rawHeaders['set-cookie'] || [];
          const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

          resolve({
            headers: rawHeaders,
            statusCode: res.statusCode,
            finalUrl: targetUrl,
            cookies,
          });
          req.destroy(); // End stream immediately after reading headers
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Connection timed out while fetching HTTP headers.'));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Analyze HTTP headers against modern web defense standards
 * @param {string} targetUrl 
 * @returns {Promise<{ checks: Array, findings: Array, rawHeaders: object, cookies: Array }>}
 */
async function assessHeaders(targetUrl) {
  const checks = [];
  const findings = [];
  let headerData;

  try {
    headerData = await fetchHeaders(targetUrl);
  } catch (err) {
    checks.push({
      checkName: 'HTTP Headers Accessibility',
      category: 'headers',
      result: 'unable_to_assess',
      scoreImpact: 0,
      details: { error: err.message },
    });
    return { checks, findings, rawHeaders: {}, cookies: [] };
  }

  const headers = headerData.headers;

  // Helper to extract header value case-insensitively
  const getHeader = (name) => {
    const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
    return key ? headers[key] : null;
  };

  // 1. Content-Security-Policy (CSP)
  const csp = getHeader('content-security-policy');
  if (!csp) {
    checks.push({
      checkName: 'Content-Security-Policy',
      category: 'headers',
      result: 'failed',
      scoreImpact: -8,
      details: { present: false, value: null },
    });
    findings.push({
      category: 'headers',
      title: 'Missing Content-Security-Policy (CSP) Header',
      description: 'The website does not enforce a Content Security Policy header. Without CSP, the application is vulnerable to Cross-Site Scripting (XSS), data injection, and malicious script execution.',
      severity: 'High',
      evidence: 'Header "Content-Security-Policy" is absent in HTTP response.',
      recommendation: "Implement a robust Content-Security-Policy header restricting script sources (e.g., default-src 'self'; script-src 'self'; object-src 'none').",
    });
  } else {
    const isWeak = csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'") || csp.includes('*');
    if (isWeak) {
      checks.push({
        checkName: 'Content-Security-Policy',
        category: 'headers',
        result: 'warning',
        scoreImpact: -3,
        details: { present: true, value: csp, note: "CSP contains permissive directives like 'unsafe-inline' or wildcard '*'" },
      });
      findings.push({
        category: 'headers',
        title: 'Permissive Content-Security-Policy Directives Detected',
        description: "The Content-Security-Policy header allows 'unsafe-inline', 'unsafe-eval', or wildcards (*), reducing the policy's effectiveness against Cross-Site Scripting.",
        severity: 'Medium',
        evidence: `Content-Security-Policy: ${csp.length > 120 ? csp.substring(0, 120) + '...' : csp}`,
        recommendation: "Refactor inline scripts into separate files with cryptographic nonces or hashes, and eliminate 'unsafe-inline' and 'unsafe-eval'.",
      });
    } else {
      checks.push({
        checkName: 'Content-Security-Policy',
        category: 'headers',
        result: 'passed',
        scoreImpact: 0,
        details: { present: true, value: csp },
      });
    }
  }

  // 2. Strict-Transport-Security (HSTS)
  const hsts = getHeader('strict-transport-security');
  if (!hsts) {
    checks.push({
      checkName: 'Strict-Transport-Security (HSTS)',
      category: 'headers',
      result: 'failed',
      scoreImpact: -8,
      details: { present: false, value: null },
    });
    findings.push({
      category: 'headers',
      title: 'Missing Strict-Transport-Security (HSTS) Header',
      description: 'HTTP Strict Transport Security is not enabled. Users are vulnerable to SSL-stripping and man-in-the-middle (MITM) attacks during initial unencrypted connections.',
      severity: 'High',
      evidence: 'Header "Strict-Transport-Security" is absent.',
      recommendation: 'Enable HSTS by returning: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload.',
    });
  } else {
    const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
    if (maxAge < 10368000) {
      // less than 120 days
      checks.push({
        checkName: 'Strict-Transport-Security (HSTS)',
        category: 'headers',
        result: 'warning',
        scoreImpact: -2,
        details: { present: true, value: hsts, maxAgeSeconds: maxAge },
      });
      findings.push({
        category: 'headers',
        title: 'HSTS max-age Duration Too Short',
        description: `The HSTS max-age is set to ${maxAge} seconds. Modern browser guidelines recommend at least 1 year (31,536,000 seconds).`,
        severity: 'Low',
        evidence: `Strict-Transport-Security: ${hsts}`,
        recommendation: 'Increase HSTS max-age to at least 31536000 seconds and includeSubDomains.',
      });
    } else {
      checks.push({
        checkName: 'Strict-Transport-Security (HSTS)',
        category: 'headers',
        result: 'passed',
        scoreImpact: 0,
        details: { present: true, value: hsts, maxAgeSeconds: maxAge },
      });
    }
  }

  // 3. X-Content-Type-Options
  const xcto = getHeader('x-content-type-options');
  if (!xcto || xcto.toLowerCase() !== 'nosniff') {
    checks.push({
      checkName: 'X-Content-Type-Options',
      category: 'headers',
      result: 'failed',
      scoreImpact: -4,
      details: { present: !!xcto, value: xcto },
    });
    findings.push({
      category: 'headers',
      title: 'Missing X-Content-Type-Options: nosniff Header',
      description: 'Browsers may attempt MIME-type sniffing on responses, potentially interpreting non-executable MIME types as executable JavaScript, leading to drive-by attacks.',
      severity: 'Medium',
      evidence: xcto ? `Value is '${xcto}' instead of 'nosniff'` : 'Header absent.',
      recommendation: 'Configure your web server to append: X-Content-Type-Options: nosniff.',
    });
  } else {
    checks.push({
      checkName: 'X-Content-Type-Options',
      category: 'headers',
      result: 'passed',
      scoreImpact: 0,
      details: { present: true, value: xcto },
    });
  }

  // 4. X-Frame-Options
  const xfo = getHeader('x-frame-options');
  if (!xfo) {
    // If CSP has frame-ancestors, XFO is superseded
    const hasFrameAncestors = csp && csp.includes('frame-ancestors');
    if (hasFrameAncestors) {
      checks.push({
        checkName: 'Clickjacking Protection (CSP frame-ancestors)',
        category: 'headers',
        result: 'passed',
        scoreImpact: 0,
        details: { present: true, via: 'CSP frame-ancestors' },
      });
    } else {
      checks.push({
        checkName: 'X-Frame-Options',
        category: 'headers',
        result: 'failed',
        scoreImpact: -4,
        details: { present: false, value: null },
      });
      findings.push({
        category: 'headers',
        title: 'Missing Clickjacking Defense (X-Frame-Options)',
        description: 'The website does not restrict embedding in iframes or frames, exposing users to clickjacking attacks where transparent UI elements trick users into clicking hidden actions.',
        severity: 'Medium',
        evidence: 'Neither X-Frame-Options nor CSP frame-ancestors is configured.',
        recommendation: 'Set X-Frame-Options: DENY or SAMEORIGIN, or configure frame-ancestors in Content-Security-Policy.',
      });
    }
  } else {
    checks.push({
      checkName: 'X-Frame-Options',
      category: 'headers',
      result: 'passed',
      scoreImpact: 0,
      details: { present: true, value: xfo },
    });
  }

  // 5. Referrer-Policy
  const rp = getHeader('referrer-policy');
  if (!rp) {
    checks.push({
      checkName: 'Referrer-Policy',
      category: 'headers',
      result: 'failed',
      scoreImpact: -3,
      details: { present: false, value: null },
    });
    findings.push({
      category: 'headers',
      title: 'Missing Referrer-Policy Header',
      description: 'Without a Referrer-Policy header, sensitive URLs and query parameters may leak in the Referer header to external third-party domains when users click outbound links.',
      severity: 'Low',
      evidence: 'Header "Referrer-Policy" is absent.',
      recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin to HTTP response headers.',
    });
  } else if (rp.toLowerCase().includes('unsafe-url')) {
    checks.push({
      checkName: 'Referrer-Policy',
      category: 'headers',
      result: 'warning',
      scoreImpact: -2,
      details: { present: true, value: rp },
    });
    findings.push({
      category: 'headers',
      title: 'Insecure Referrer-Policy Value (unsafe-url)',
      description: 'The Referrer-Policy is set to unsafe-url, which leaks full URL query parameters and paths across all outbound cross-origin requests.',
      severity: 'Low',
      evidence: `Referrer-Policy: ${rp}`,
      recommendation: 'Switch to strict-origin-when-cross-origin or no-referrer.',
    });
  } else {
    checks.push({
      checkName: 'Referrer-Policy',
      category: 'headers',
      result: 'passed',
      scoreImpact: 0,
      details: { present: true, value: rp },
    });
  }

  // 6. Permissions-Policy
  const pp = getHeader('permissions-policy') || getHeader('feature-policy');
  if (!pp) {
    checks.push({
      checkName: 'Permissions-Policy',
      category: 'headers',
      result: 'warning',
      scoreImpact: -3,
      details: { present: false, value: null },
    });
    findings.push({
      category: 'headers',
      title: 'Missing Permissions-Policy Header',
      description: 'Permissions-Policy allows developers to explicitly deny access to browser hardware APIs (camera, microphone, geolocation, payment). Absence allows embedded third-party scripts to request permissions.',
      severity: 'Low',
      evidence: 'Header "Permissions-Policy" is absent.',
      recommendation: 'Configure Permissions-Policy (e.g., Permissions-Policy: camera=(), microphone=(), geolocation=()).',
    });
  } else {
    checks.push({
      checkName: 'Permissions-Policy',
      category: 'headers',
      result: 'passed',
      scoreImpact: 0,
      details: { present: true, value: pp },
    });
  }

  // 7. Information Leakage (Server & X-Powered-By)
  const serverBanner = getHeader('server');
  const poweredBy = getHeader('x-powered-by');
  if (serverBanner && /\d/.test(serverBanner)) {
    findings.push({
      category: 'headers',
      title: 'Server Version Disclosure in HTTP Header',
      description: `The web server discloses its software and version number (${serverBanner}) in the "Server" header, aiding attackers in version-specific exploit discovery.`,
      severity: 'Informational',
      evidence: `Server: ${serverBanner}`,
      recommendation: 'Disable server version tokens in your web server configuration (e.g. ServerTokens Prod in Apache, server_tokens off in Nginx).',
    });
  }
  if (poweredBy) {
    findings.push({
      category: 'headers',
      title: 'Technology Stack Disclosure (X-Powered-By)',
      description: `The application reveals underlying backend technologies (${poweredBy}) via the X-Powered-By header.`,
      severity: 'Informational',
      evidence: `X-Powered-By: ${poweredBy}`,
      recommendation: 'Remove the X-Powered-By header (e.g., app.disable("x-powered-by") in Express).',
    });
  }

  return {
    checks,
    findings,
    rawHeaders: headers,
    cookies: headerData.cookies,
  };
}

module.exports = {
  assessHeaders,
  fetchHeaders,
};
