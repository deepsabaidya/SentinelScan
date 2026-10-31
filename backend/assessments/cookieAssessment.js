/**
 * Cookie Security Flags Assessment Module
 * Passive analysis of Set-Cookie response directives (Secure, HttpOnly, SameSite)
 */

/**
 * Parse a Set-Cookie header string into its name, value, and attributes
 * @param {string} cookieStr 
 * @returns {object}
 */
function parseCookie(cookieStr) {
  if (!cookieStr || typeof cookieStr !== 'string') return null;

  const parts = cookieStr.split(';').map((p) => p.trim());
  const [firstPart, ...attributeParts] = parts;
  const equalsIndex = firstPart.indexOf('=');

  const name = equalsIndex > 0 ? firstPart.substring(0, equalsIndex).trim() : firstPart;
  const value = equalsIndex > 0 ? firstPart.substring(equalsIndex + 1).trim() : '';

  const attributes = {
    name,
    secure: false,
    httpOnly: false,
    sameSite: null,
    domain: null,
    path: null,
    maxAge: null,
  };

  for (const attr of attributeParts) {
    const attrLower = attr.toLowerCase();
    if (attrLower === 'secure') {
      attributes.secure = true;
    } else if (attrLower === 'httponly') {
      attributes.httpOnly = true;
    } else if (attrLower.startsWith('samesite=')) {
      attributes.sameSite = attr.substring(9).trim();
    } else if (attrLower.startsWith('domain=')) {
      attributes.domain = attr.substring(7).trim();
    } else if (attrLower.startsWith('path=')) {
      attributes.path = attr.substring(5).trim();
    } else if (attrLower.startsWith('max-age=')) {
      attributes.maxAge = parseInt(attr.substring(8).trim(), 10);
    }
  }

  return attributes;
}

/**
 * Assess passive cookie security
 * @param {Array<string>} cookieHeaders 
 * @returns {{ checks: Array, findings: Array, analyzedCookies: Array }}
 */
function assessCookies(cookieHeaders = []) {
  const checks = [];
  const findings = [];
  const analyzedCookies = [];

  if (!cookieHeaders || cookieHeaders.length === 0) {
    checks.push({
      checkName: 'Cookie Security Attributes',
      category: 'cookies',
      result: 'passed',
      scoreImpact: 0,
      details: {
        note: 'No cookies are set on the root landing response. No insecure cookie flags detected.',
        cookieCount: 0,
      },
    });
    return { checks, findings, analyzedCookies };
  }

  let totalInsecure = 0;

  for (const rawCookie of cookieHeaders) {
    const parsed = parseCookie(rawCookie);
    if (!parsed) continue;

    analyzedCookies.push({
      name: parsed.name,
      secure: parsed.secure,
      httpOnly: parsed.httpOnly,
      sameSite: parsed.sameSite,
    });

    // Check Secure flag
    if (!parsed.secure) {
      totalInsecure++;
      findings.push({
        category: 'cookies',
        title: `Cookie "${parsed.name}" Missing "Secure" Flag`,
        description: `The cookie "${parsed.name}" is set without the Secure attribute. Insecure transmission across unencrypted HTTP allows eavesdroppers to intercept session data.`,
        severity: 'Medium',
        evidence: `Set-Cookie: ${rawCookie.length > 100 ? rawCookie.substring(0, 100) + '...' : rawCookie}`,
        recommendation: `Add the "Secure" attribute to Set-Cookie for "${parsed.name}" so browsers only send it over TLS/HTTPS.`,
      });
    }

    // Check HttpOnly flag
    if (!parsed.httpOnly) {
      findings.push({
        category: 'cookies',
        title: `Cookie "${parsed.name}" Missing "HttpOnly" Flag`,
        description: `The cookie "${parsed.name}" can be accessed by client-side JavaScript via document.cookie. If an XSS vulnerability exists, attackers can steal this cookie.`,
        severity: 'Medium',
        evidence: `HttpOnly flag missing in cookie "${parsed.name}".`,
        recommendation: `Add the "HttpOnly" attribute to Set-Cookie for "${parsed.name}" unless JavaScript explicitly needs read access.`,
      });
    }

    // Check SameSite attribute
    if (!parsed.sameSite) {
      findings.push({
        category: 'cookies',
        title: `Cookie "${parsed.name}" Missing "SameSite" Attribute`,
        description: `The cookie "${parsed.name}" does not specify a SameSite attribute (Lax or Strict), leaving the application vulnerable to Cross-Site Request Forgery (CSRF).`,
        severity: 'Low',
        evidence: `SameSite attribute absent for cookie "${parsed.name}".`,
        recommendation: `Set SameSite=Lax (or SameSite=Strict) on cookie "${parsed.name}".`,
      });
    } else if (parsed.sameSite.toLowerCase() === 'none' && !parsed.secure) {
      findings.push({
        category: 'cookies',
        title: `Insecure SameSite=None Configuration for "${parsed.name}"`,
        description: `SameSite=None requires the Secure attribute in all modern browsers. Without Secure, browsers will reject the cookie.`,
        severity: 'High',
        evidence: `SameSite=None without Secure flag on "${parsed.name}".`,
        recommendation: `Always pair SameSite=None with the Secure attribute.`,
      });
    }
  }

  if (totalInsecure > 0) {
    checks.push({
      checkName: 'Cookie Security Flags (Secure/HttpOnly/SameSite)',
      category: 'cookies',
      result: 'warning',
      scoreImpact: -5,
      details: {
        totalCookies: cookieHeaders.length,
        insecureCookiesCount: totalInsecure,
        analyzedCookies,
      },
    });
  } else {
    checks.push({
      checkName: 'Cookie Security Flags (Secure/HttpOnly/SameSite)',
      category: 'cookies',
      result: 'passed',
      scoreImpact: 0,
      details: {
        totalCookies: cookieHeaders.length,
        analyzedCookies,
      },
    });
  }

  return { checks, findings, analyzedCookies };
}

module.exports = {
  assessCookies,
  parseCookie,
};
