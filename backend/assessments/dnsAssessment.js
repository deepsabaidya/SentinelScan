/**
 * DNS Security & Configuration Assessment Module
 * Passive analysis of DNS infrastructure: A, AAAA, MX, NS, TXT, SPF, and DMARC
 */
const dns = require('dns').promises;

/**
 * Perform safe DNS queries for a domain
 * @param {string} domain 
 * @returns {Promise<{ checks: Array, findings: Array, dnsDetails: object }>}
 */
async function assessDNS(domain) {
  const checks = [];
  const findings = [];
  const dnsDetails = {
    aRecords: [],
    aaaaRecords: [],
    mxRecords: [],
    nsRecords: [],
    txtRecords: [],
    hasSPF: false,
    hasDMARC: false,
  };

  // 1. A Records (IPv4)
  try {
    const aRecords = await dns.resolve4(domain);
    dnsDetails.aRecords = aRecords;
    checks.push({
      checkName: 'DNS A (IPv4) Resolution',
      category: 'dns',
      result: 'passed',
      scoreImpact: 0,
      details: { count: aRecords.length, records: aRecords },
    });
  } catch (err) {
    checks.push({
      checkName: 'DNS A (IPv4) Resolution',
      category: 'dns',
      result: 'unable_to_assess',
      scoreImpact: 0,
      details: { error: err.message },
    });
  }

  // 2. AAAA Records (IPv6 Readiness)
  try {
    const aaaaRecords = await dns.resolve6(domain);
    dnsDetails.aaaaRecords = aaaaRecords;
    checks.push({
      checkName: 'DNS AAAA (IPv6) Support',
      category: 'dns',
      result: 'passed',
      scoreImpact: 0,
      details: { count: aaaaRecords.length, records: aaaaRecords },
    });
  } catch (err) {
    // Lack of IPv6 is common and is an informational observation
    checks.push({
      checkName: 'DNS AAAA (IPv6) Support',
      category: 'dns',
      result: 'warning',
      scoreImpact: 0,
      details: { note: 'No IPv6 (AAAA) records configured' },
    });
    findings.push({
      category: 'dns',
      title: 'Missing IPv6 (AAAA) DNS Records',
      description: 'The domain does not publish IPv6 (AAAA) DNS records. Adding IPv6 support ensures modern dual-stack network connectivity.',
      severity: 'Informational',
      evidence: 'dns.resolve6 returned no records.',
      recommendation: 'Configure an AAAA record pointing to your server\'s public IPv6 address.',
    });
  }

  // 3. NS Records (Name Server Redundancy)
  try {
    const nsRecords = await dns.resolveNs(domain);
    dnsDetails.nsRecords = nsRecords;
    if (nsRecords.length < 2) {
      checks.push({
        checkName: 'DNS Nameserver Redundancy',
        category: 'dns',
        result: 'warning',
        scoreImpact: -3,
        details: { count: nsRecords.length, records: nsRecords },
      });
      findings.push({
        category: 'dns',
        title: 'Insufficient DNS Nameserver Redundancy',
        description: `Only ${nsRecords.length} nameserver is configured for ${domain}. Industry RFC standards mandate at least 2 geographically distributed authoritative nameservers for fault tolerance.`,
        severity: 'Low',
        evidence: `Configured nameservers: ${nsRecords.join(', ')}`,
        recommendation: 'Add secondary authoritative nameservers across separate network providers or data centers.',
      });
    } else {
      checks.push({
        checkName: 'DNS Nameserver Redundancy',
        category: 'dns',
        result: 'passed',
        scoreImpact: 0,
        details: { count: nsRecords.length, records: nsRecords },
      });
    }
  } catch (err) {
    checks.push({
      checkName: 'DNS Nameserver Redundancy',
      category: 'dns',
      result: 'unable_to_assess',
      scoreImpact: 0,
      details: { error: err.message },
    });
  }

  // 4. MX Records (Mail Exchange)
  try {
    const mxRecords = await dns.resolveMx(domain);
    dnsDetails.mxRecords = mxRecords;
    checks.push({
      checkName: 'DNS Mail Exchange (MX) Configuration',
      category: 'dns',
      result: 'passed',
      scoreImpact: 0,
      details: { count: mxRecords.length, records: mxRecords },
    });
  } catch (err) {
    checks.push({
      checkName: 'DNS Mail Exchange (MX) Configuration',
      category: 'dns',
      result: 'warning',
      scoreImpact: 0,
      details: { note: 'No MX records published (domain may not handle email)' },
    });
  }

  // 5. TXT Records & SPF (Sender Policy Framework)
  try {
    const rawTxtRecords = await dns.resolveTxt(domain);
    const flattenedTxt = rawTxtRecords.map((chunk) => chunk.join(''));
    dnsDetails.txtRecords = flattenedTxt;

    const spfRecord = flattenedTxt.find((txt) => txt.toLowerCase().startsWith('v=spf1'));
    if (spfRecord) {
      dnsDetails.hasSPF = true;
      checks.push({
        checkName: 'Email Spoofing Defense (SPF Record)',
        category: 'dns',
        result: 'passed',
        scoreImpact: 0,
        details: { record: spfRecord },
      });
    } else {
      checks.push({
        checkName: 'Email Spoofing Defense (SPF Record)',
        category: 'dns',
        result: 'warning',
        scoreImpact: -4,
        details: { present: false },
      });
      findings.push({
        category: 'dns',
        title: 'Missing SPF (Sender Policy Framework) TXT Record',
        description: 'The domain has no published SPF record. Threat actors can easily forge email headers pretending to send emails from your domain.',
        severity: 'Medium',
        evidence: 'No TXT record beginning with "v=spf1" found.',
        recommendation: 'Publish a TXT record with your authorized mail senders, e.g., "v=spf1 include:_spf.google.com ~all".',
      });
    }
  } catch (err) {
    checks.push({
      checkName: 'Email Spoofing Defense (SPF Record)',
      category: 'dns',
      result: 'unable_to_assess',
      scoreImpact: 0,
      details: { error: err.message },
    });
  }

  // 6. DMARC Record (_dmarc.domain)
  try {
    const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
    const flattenedDmarc = dmarcRecords.map((chunk) => chunk.join(''));
    const dmarc = flattenedDmarc.find((txt) => txt.toLowerCase().startsWith('v=dmarc1'));

    if (dmarc) {
      dnsDetails.hasDMARC = true;
      checks.push({
        checkName: 'DMARC Domain Alignment & Policy',
        category: 'dns',
        result: 'passed',
        scoreImpact: 0,
        details: { record: dmarc },
      });
    } else {
      checks.push({
        checkName: 'DMARC Domain Alignment & Policy',
        category: 'dns',
        result: 'warning',
        scoreImpact: -4,
        details: { present: false },
      });
      findings.push({
        category: 'dns',
        title: 'Missing DMARC Policy Record',
        description: 'No DMARC (Domain-based Message Authentication, Reporting, and Conformance) TXT record was found at _dmarc.domain. Without DMARC, receiver mail servers cannot verify whether forged emails should be rejected or quarantined.',
        severity: 'Medium',
        evidence: `_dmarc.${domain} TXT record not found.`,
        recommendation: 'Publish a DMARC policy at _dmarc.yourdomain.com (e.g., "v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com").',
      });
    }
  } catch (err) {
    checks.push({
      checkName: 'DMARC Domain Alignment & Policy',
      category: 'dns',
      result: 'warning',
      scoreImpact: -4,
      details: { note: 'No DMARC record found at _dmarc host' },
    });
    findings.push({
      category: 'dns',
      title: 'Missing DMARC Policy Record',
      description: 'No DMARC (Domain-based Message Authentication, Reporting, and Conformance) TXT record was found. Spammers can spoof emails without enforcement.',
      severity: 'Medium',
      evidence: `Query to _dmarc.${domain} failed or returned empty.`,
      recommendation: 'Add a TXT record for _dmarc.domain with at least "v=DMARC1; p=none;".',
    });
  }

  return {
    checks,
    findings,
    dnsDetails,
  };
}

module.exports = {
  assessDNS,
};
