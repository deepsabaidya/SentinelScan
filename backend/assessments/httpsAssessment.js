/**
 * HTTPS & Redirection Assessment Module
 * Analyzes whether plain HTTP requests properly redirect to secure HTTPS
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Check plain HTTP port 80 behavior and redirection to HTTPS
 * @param {string} domain 
 * @param {number} timeoutMs 
 * @returns {Promise<{ checks: Array, findings: Array, details: object }>}
 */
async function assessHTTPS(domain, timeoutMs = 10000) {
  const checks = [];
  const findings = [];

  const targetHttpUrl = `http://${domain}/`;

  return new Promise((resolve) => {
    try {
      const parsed = new URL(targetHttpUrl);
      const req = http.request(
        parsed,
        {
          method: 'GET',
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SentinelScan-Audit/1.0',
            'Accept': 'text/html,*/*',
          },
        },
        (res) => {
          const statusCode = res.statusCode;
          const location = res.headers['location'];
          req.destroy();

          const isRedirect = [301, 302, 307, 308].includes(statusCode);
          let redirectsToHttps = false;

          if (isRedirect && location) {
            try {
              const redirectUrl = new URL(location, targetHttpUrl);
              redirectsToHttps = redirectUrl.protocol === 'https:';
            } catch (e) {
              redirectsToHttps = false;
            }
          }

          if (redirectsToHttps) {
            checks.push({
              checkName: 'HTTP-to-HTTPS Redirection',
              category: 'https',
              result: 'passed',
              scoreImpact: 0,
              details: {
                statusCode,
                redirectLocation: location,
                secureDestination: true,
              },
            });
          } else if (statusCode === 200) {
            checks.push({
              checkName: 'HTTP-to-HTTPS Redirection',
              category: 'https',
              result: 'failed',
              scoreImpact: -10,
              details: {
                statusCode,
                note: 'Plain HTTP responds with 200 OK without redirecting to HTTPS',
              },
            });
            findings.push({
              category: 'https',
              title: 'Insecure Plain HTTP Permitted Without HTTPS Redirection',
              description: 'The web server serves content over unencrypted HTTP (port 80) without enforcing an automatic upgrade/redirection to HTTPS. This allows attackers to snoop traffic or perform SSL-stripping MITM attacks.',
              severity: 'High',
              evidence: `HTTP GET ${targetHttpUrl} returned status ${statusCode} with no HTTPS redirect.`,
              recommendation: 'Configure your web server (Nginx/Apache/Cloudflare) to issue a 301 Permanent Redirect for all HTTP requests to their HTTPS equivalent.',
            });
          } else {
            checks.push({
              checkName: 'HTTP-to-HTTPS Redirection',
              category: 'https',
              result: 'warning',
              scoreImpact: -4,
              details: {
                statusCode,
                location,
                redirectsToHttps: false,
              },
            });
            findings.push({
              category: 'https',
              title: 'HTTP Does Not Redirect Directly to HTTPS',
              description: `HTTP requests returned status code ${statusCode} redirecting to ${location || 'an unknown location'} instead of a secure HTTPS endpoint.`,
              severity: 'Medium',
              evidence: `HTTP Status: ${statusCode}, Location: ${location || 'none'}`,
              recommendation: 'Ensure all HTTP port 80 traffic immediately redirects to https:// using a 301 or 308 redirect.',
            });
          }

          resolve({
            checks,
            findings,
            details: {
              httpStatusCode: statusCode,
              redirectLocation: location || null,
              redirectsToHttps,
            },
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        checks.push({
          checkName: 'HTTP-to-HTTPS Redirection',
          category: 'https',
          result: 'unable_to_assess',
          scoreImpact: 0,
          details: { error: 'HTTP port 80 connection timed out.' },
        });
        resolve({ checks, findings, details: { error: 'Timeout' } });
      });

      req.on('error', (err) => {
        // If port 80 is closed, site might be HTTPS-only (which is safe if HTTPS works!)
        checks.push({
          checkName: 'HTTP-to-HTTPS Redirection',
          category: 'https',
          result: 'passed',
          scoreImpact: 0,
          details: { note: `HTTP port 80 appears closed/refused (${err.message}). Direct HTTPS expected.` },
        });
        resolve({ checks, findings, details: { port80Closed: true } });
      });

      req.end();
    } catch (err) {
      checks.push({
        checkName: 'HTTP-to-HTTPS Redirection',
        category: 'https',
        result: 'unable_to_assess',
        scoreImpact: 0,
        details: { error: err.message },
      });
      resolve({ checks, findings, details: { error: err.message } });
    }
  });
}

module.exports = {
  assessHTTPS,
};
