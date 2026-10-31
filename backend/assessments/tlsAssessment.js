/**
 * SSL/TLS Certificate & Configuration Assessment Module
 * Passive analysis of TLS socket parameters, certificate chain, and validity
 */
const tls = require('tls');

/**
 * Connect via TLS to target host:443 and inspect peer certificate
 * @param {string} domain 
 * @param {number} port 
 * @param {number} timeoutMs 
 * @returns {Promise<{ authorized: boolean, cert: object, protocol: string, cipher: object, authorizationError: string }>}
 */
function inspectTLS(domain, port = 443, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    try {
      const socket = tls.connect(
        {
          host: domain,
          port,
          servername: domain, // SNI support
          rejectUnauthorized: false, // We inspect authorization manually to capture details
          timeout: timeoutMs,
        },
        () => {
          const cert = socket.getPeerCertificate(true);
          const authorized = socket.authorized;
          const authorizationError = socket.authorizationError;
          const protocol = socket.getProtocol();
          const cipher = socket.getCipher();

          socket.end();
          resolve({
            authorized,
            authorizationError,
            cert,
            protocol,
            cipher,
          });
        }
      );

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`TLS connection timed out to ${domain}:${port}`));
      });

      socket.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Check if the given domain matches the certificate's Common Name or Subject Alternative Names (SANs)
 * Supports wildcard matching (e.g. *.example.com matches sub.example.com)
 * @param {string} domain 
 * @param {object} cert 
 * @returns {boolean}
 */
function verifyHostname(domain, cert) {
  if (!cert) return false;
  const target = domain.toLowerCase();
  const names = [];

  if (cert.subject && cert.subject.CN) {
    names.push(cert.subject.CN.toLowerCase());
  }
  if (cert.subjectaltname) {
    // format: "DNS:example.com, DNS:*.example.com"
    const sans = cert.subjectaltname
      .split(',')
      .map((item) => item.trim().replace(/^DNS:/i, '').toLowerCase());
    names.push(...sans);
  }

  for (const name of names) {
    if (name === target) return true;
    if (name.startsWith('*.')) {
      const baseDomain = name.slice(2);
      // Wildcard matches one level of subdomain
      const parts = target.split('.');
      if (parts.length > 2) {
        const targetBase = parts.slice(1).join('.');
        if (targetBase === baseDomain) return true;
      }
    }
  }

  return false;
}

/**
 * Assess SSL/TLS security of domain
 * @param {string} domain 
 * @returns {Promise<{ checks: Array, findings: Array, tlsDetails: object }>}
 */
async function assessTLS(domain) {
  const checks = [];
  const findings = [];

  let tlsData;
  try {
    tlsData = await inspectTLS(domain);
  } catch (err) {
    checks.push({
      checkName: 'SSL/TLS Availability',
      category: 'ssl_tls',
      result: 'unable_to_assess',
      scoreImpact: 0,
      details: { error: `HTTPS/TLS service unavailable: ${err.message}` },
    });
    findings.push({
      category: 'ssl_tls',
      title: 'HTTPS / TLS Port 443 Unreachable',
      description: `Unable to establish a secure TLS handshake on port 443 for domain ${domain}. The site may not have HTTPS enabled.`,
      severity: 'Critical',
      evidence: err.message,
      recommendation: 'Deploy an SSL/TLS certificate from a trusted Certificate Authority (e.g. Let\'s Encrypt) and bind it to port 443.',
    });
    return { checks, findings, tlsDetails: null };
  }

  const { authorized, authorizationError, cert, protocol, cipher } = tlsData;

  if (!cert || Object.keys(cert).length === 0) {
    checks.push({
      checkName: 'Certificate Presence',
      category: 'ssl_tls',
      result: 'failed',
      scoreImpact: -15,
      details: { authorized: false, reason: 'No peer certificate presented' },
    });
    return { checks, findings, tlsDetails: null };
  }

  // 1. Certificate Validity & Trust
  if (!authorized) {
    checks.push({
      checkName: 'SSL/TLS Certificate Trust & Validity',
      category: 'ssl_tls',
      result: 'failed',
      scoreImpact: -15,
      details: { authorized: false, error: authorizationError },
    });
    findings.push({
      category: 'ssl_tls',
      title: 'Untrusted or Invalid SSL/TLS Certificate',
      description: `The SSL/TLS certificate presented by ${domain} failed validation: ${authorizationError}. Web browsers will display severe security warnings.`,
      severity: 'Critical',
      evidence: `Authorization Error: ${authorizationError}`,
      recommendation: 'Replace the self-signed, untrusted, or incomplete certificate chain with a valid certificate from a recognized public CA.',
    });
  } else {
    checks.push({
      checkName: 'SSL/TLS Certificate Trust & Validity',
      category: 'ssl_tls',
      result: 'passed',
      scoreImpact: 0,
      details: { authorized: true, issuer: cert.issuer?.O || cert.issuer?.CN },
    });
  }

  // 2. Expiration Date & Remaining Days
  const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
  const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
  const now = new Date();

  if (validTo) {
    const msRemaining = validTo.getTime() - now.getTime();
    const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      checks.push({
        checkName: 'Certificate Expiration',
        category: 'ssl_tls',
        result: 'failed',
        scoreImpact: -15,
        details: { validTo: validTo.toISOString(), daysRemaining, status: 'EXPIRED' },
      });
      findings.push({
        category: 'ssl_tls',
        title: 'SSL/TLS Certificate Expired',
        description: `The certificate expired ${Math.abs(daysRemaining)} days ago on ${validTo.toUTCString()}. Users will be blocked from accessing the site.`,
        severity: 'Critical',
        evidence: `Expired on ${validTo.toISOString()}`,
        recommendation: 'Renew the SSL/TLS certificate immediately and configure automated renewal hooks.',
      });
    } else if (daysRemaining <= 14) {
      checks.push({
        checkName: 'Certificate Expiration',
        category: 'ssl_tls',
        result: 'warning',
        scoreImpact: -5,
        details: { validTo: validTo.toISOString(), daysRemaining, status: 'EXPIRING_IMMINENTLY' },
      });
      findings.push({
        category: 'ssl_tls',
        title: 'SSL/TLS Certificate Expiring Soon (Within 14 Days)',
        description: `The certificate will expire in ${daysRemaining} days on ${validTo.toUTCString()}.`,
        severity: 'High',
        evidence: `Valid until ${validTo.toISOString()} (${daysRemaining} days remaining)`,
        recommendation: 'Trigger the certificate renewal process promptly to avoid unexpected service disruption.',
      });
    } else if (daysRemaining <= 30) {
      checks.push({
        checkName: 'Certificate Expiration',
        category: 'ssl_tls',
        result: 'warning',
        scoreImpact: -2,
        details: { validTo: validTo.toISOString(), daysRemaining, status: 'EXPIRING_SOON' },
      });
      findings.push({
        category: 'ssl_tls',
        title: 'SSL/TLS Certificate Renewal Notice',
        description: `The certificate expires in ${daysRemaining} days on ${validTo.toUTCString()}.`,
        severity: 'Low',
        evidence: `Valid until ${validTo.toISOString()} (${daysRemaining} days remaining)`,
        recommendation: 'Plan certificate renewal before the 30-day window closes.',
      });
    } else {
      checks.push({
        checkName: 'Certificate Expiration',
        category: 'ssl_tls',
        result: 'passed',
        scoreImpact: 0,
        details: { validTo: validTo.toISOString(), daysRemaining, status: 'HEALTHY' },
      });
    }
  }

  // 3. Hostname Verification (SAN & CN)
  const isHostnameValid = verifyHostname(domain, cert);
  if (!isHostnameValid) {
    checks.push({
      checkName: 'Certificate Hostname Matching',
      category: 'ssl_tls',
      result: 'failed',
      scoreImpact: -10,
      details: {
        domain,
        cn: cert.subject?.CN,
        sans: cert.subjectaltname,
      },
    });
    findings.push({
      category: 'ssl_tls',
      title: 'Hostname / Certificate Name Mismatch',
      description: `The domain name '${domain}' does not match the certificate Common Name (${cert.subject?.CN}) or Subject Alternative Names. Browsers will reject this connection.`,
      severity: 'Critical',
      evidence: `Domain: ${domain}, Certificate CN: ${cert.subject?.CN}`,
      recommendation: 'Reissue the certificate including this exact domain or wildcard in the Subject Alternative Names (SAN).',
    });
  } else {
    checks.push({
      checkName: 'Certificate Hostname Matching',
      category: 'ssl_tls',
      result: 'passed',
      scoreImpact: 0,
      details: { domain, matched: true },
    });
  }

  // 4. Protocol Version
  if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
    checks.push({
      checkName: 'TLS Protocol Version',
      category: 'ssl_tls',
      result: 'failed',
      scoreImpact: -8,
      details: { protocol },
    });
    findings.push({
      category: 'ssl_tls',
      title: 'Deprecated TLS Protocol Version in Use',
      description: `The server negotiated ${protocol}, which is deprecated and contains known cryptographic weaknesses (POODLE, BEAST).`,
      severity: 'High',
      evidence: `Negotiated Protocol: ${protocol}`,
      recommendation: 'Disable TLS 1.0 and TLS 1.1 on your server. Only enable TLS 1.2 and TLS 1.3.',
    });
  } else {
    checks.push({
      checkName: 'TLS Protocol Version',
      category: 'ssl_tls',
      result: 'passed',
      scoreImpact: 0,
      details: { protocol, modern: protocol === 'TLSv1.3' },
    });
  }

  const tlsDetails = {
    authorized,
    protocol,
    cipher: cipher?.name,
    issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
    subject: cert.subject?.CN || domain,
    validFrom: validFrom ? validFrom.toISOString() : null,
    validTo: validTo ? validTo.toISOString() : null,
    serialNumber: cert.serialNumber,
    fingerprint: cert.fingerprint256 || cert.fingerprint,
  };

  return {
    checks,
    findings,
    tlsDetails,
  };
}

module.exports = {
  assessTLS,
  inspectTLS,
  verifyHostname,
};
