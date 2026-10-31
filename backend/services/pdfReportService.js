/**
 * SentinelScan PDF Executive & Technical Report Generator
 * Powered by PDFKit to deliver boardroom and engineering ready reports.
 */
const PDFDocument = require('pdfkit');

/**
 * Generate a comprehensive PDF security assessment report
 * @param {object} assessment - Assessment document
 * @param {Array} findings - Array of finding documents
 * @param {Array} checks - Array of assessmentCheck documents
 * @param {NodeJS.WritableStream} res - Express HTTP response stream
 */
function generatePDFReport(assessment, findings, checks, res) {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    bufferPages: true,
  });

  // Pipe directly to HTTP response
  doc.pipe(res);

  // Colors
  const COLOR_NAVY = '#0F172A';
  const COLOR_TEXT = '#1E293B';
  const COLOR_MUTED = '#64748B';
  const COLOR_CYAN = '#0EA5E9';
  const COLOR_BORDER = '#E2E8F0';

  const SEVERITY_COLORS = {
    Critical: '#DC2626',
    High: '#EA580C',
    Medium: '#D97706',
    Low: '#2563EB',
    Informational: '#475569',
  };

  // Header Banner
  doc.rect(0, 0, doc.page.width, 110).fill('#0B132B');

  // Title & Branding
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('SENTINELSCAN', 40, 28);
  doc.fillColor('#38BDF8').fontSize(9).font('Helvetica').text('WEBSITE SECURITY & VULNERABILITY ASSESSMENT REPORT', 40, 54);
  doc.fillColor('#94A3B8').fontSize(8).font('Helvetica-Oblique').text('See Your Security. Strengthen Your Defences.', 40, 68);

  // Status / Grade Badge on Top Right
  const score = assessment.securityScore || 0;
  const grade = assessment.securityGrade || 'Pending';
  let badgeColor = '#10B981';
  if (score < 40) badgeColor = '#EF4444';
  else if (score < 60) badgeColor = '#F97316';
  else if (score < 75) badgeColor = '#F59E0B';
  else if (score < 90) badgeColor = '#3B82F6';

  doc.rect(doc.page.width - 150, 24, 110, 62).fill(badgeColor);
  doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold').text('OVERALL SCORE', doc.page.width - 150, 32, { width: 110, align: 'center' });
  doc.fontSize(22).font('Helvetica-Bold').text(`${score}/100`, doc.page.width - 150, 46, { width: 110, align: 'center' });
  doc.fontSize(9).font('Helvetica').text(`Grade: ${grade}`, doc.page.width - 150, 70, { width: 110, align: 'center' });

  doc.moveDown(4.5);

  // Meta Information Table
  const startY = 125;
  doc.rect(40, startY, doc.page.width - 80, 75).fill('#F8FAFC').stroke('#E2E8F0');

  doc.fillColor(COLOR_NAVY).fontSize(9).font('Helvetica-Bold');
  doc.text('Target Website:', 55, startY + 12);
  doc.font('Helvetica').text(assessment.targetUrl || assessment.targetDomain, 150, startY + 12);

  doc.font('Helvetica-Bold').text('Assessment ID:', 55, startY + 28);
  doc.font('Helvetica').text(assessment._id.toString(), 150, startY + 28);

  doc.font('Helvetica-Bold').text('Date & Time:', 55, startY + 44);
  const dateStr = assessment.completedAt ? new Date(assessment.completedAt).toUTCString() : new Date().toUTCString();
  doc.font('Helvetica').text(dateStr, 150, startY + 44);

  doc.font('Helvetica-Bold').text('Assessment Type:', 55, startY + 60);
  doc.font('Helvetica').text('Automated Non-Invasive Passive Security Audit', 150, startY + 60);

  // Summary Metrics Cards
  const cardY = startY + 90;
  const cardWidth = (doc.page.width - 80 - 30) / 4;

  const summaryItems = [
    { label: 'Total Findings', val: findings.length, color: '#334155' },
    { label: 'Critical Risk', val: assessment.summary?.critical || 0, color: SEVERITY_COLORS.Critical },
    { label: 'High Risk', val: assessment.summary?.high || 0, color: SEVERITY_COLORS.High },
    { label: 'Medium Risk', val: assessment.summary?.medium || 0, color: SEVERITY_COLORS.Medium },
  ];

  summaryItems.forEach((item, i) => {
    const x = 40 + i * (cardWidth + 10);
    doc.rect(x, cardY, cardWidth, 50).fill('#FFFFFF').stroke(COLOR_BORDER);
    doc.fillColor(item.color).fontSize(18).font('Helvetica-Bold').text(item.val.toString(), x, cardY + 10, { width: cardWidth, align: 'center' });
    doc.fillColor(COLOR_MUTED).fontSize(8).font('Helvetica').text(item.label, x, cardY + 32, { width: cardWidth, align: 'center' });
  });

  // Section: Executive Summary & Assessment Methodology
  let curY = cardY + 65;
  doc.fillColor(COLOR_NAVY).fontSize(13).font('Helvetica-Bold').text('1. Executive Summary & Methodology', 40, curY);
  curY += 18;

  doc.fillColor(COLOR_TEXT).fontSize(9).font('Helvetica').text(
    'SentinelScan conducted an authorized, non-invasive passive security assessment of the target host. The evaluation tested modern browser defensive headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy), SSL/TLS certificate validity and cryptographic protocols, HTTP-to-HTTPS redirect posture, cookie security flags (Secure, HttpOnly, SameSite), and DNS integrity (A, AAAA, MX, NS redundancy, SPF, and DMARC).',
    40,
    curY,
    { width: doc.page.width - 80, lineGap: 3 }
  );

  curY += 55;

  // Section: Detailed Findings
  doc.fillColor(COLOR_NAVY).fontSize(13).font('Helvetica-Bold').text(`2. Security Findings (${findings.length})`, 40, curY);
  curY += 20;

  if (findings.length === 0) {
    doc.fillColor('#10B981').fontSize(10).font('Helvetica-Bold').text('No security vulnerabilities identified. Target satisfies assessed baselines.', 40, curY);
    curY += 30;
  } else {
    findings.forEach((finding, idx) => {
      // Check page break
      if (curY > doc.page.height - 120) {
        doc.addPage();
        curY = 50;
      }

      const badgeColor = SEVERITY_COLORS[finding.severity] || '#64748B';

      // Finding Box
      doc.rect(40, curY, doc.page.width - 80, 18).fill('#F1F5F9');
      // Severity Pill
      doc.rect(44, curY + 2, 60, 14).fill(badgeColor);
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text(finding.severity.toUpperCase(), 44, curY + 4, { width: 60, align: 'center' });

      // Title
      doc.fillColor(COLOR_NAVY).fontSize(9).font('Helvetica-Bold').text(
        `#${idx + 1} - ${finding.title} [${(finding.category || '').toUpperCase()}]`,
        112,
        curY + 4,
        { width: doc.page.width - 160 }
      );

      curY += 24;

      // Description
      doc.fillColor(COLOR_TEXT).fontSize(8.5).font('Helvetica').text(
        `Description: ${finding.description}`,
        48,
        curY,
        { width: doc.page.width - 96, lineGap: 2 }
      );
      curY += doc.heightOfString(`Description: ${finding.description}`, { width: doc.page.width - 96 }) + 6;

      // Evidence (if any)
      if (finding.evidence) {
        doc.fillColor('#B91C1C').fontSize(8).font('Courier').text(
          `Evidence: ${finding.evidence}`,
          48,
          curY,
          { width: doc.page.width - 96 }
        );
        curY += doc.heightOfString(`Evidence: ${finding.evidence}`, { width: doc.page.width - 96 }) + 6;
      }

      // Recommendation
      doc.fillColor('#0369A1').fontSize(8.5).font('Helvetica-Bold').text(
        `Remediation: `,
        48,
        curY,
        { continued: true }
      ).font('Helvetica').text(finding.recommendation, { width: doc.page.width - 96 });

      curY += doc.heightOfString(`Remediation: ${finding.recommendation}`, { width: doc.page.width - 96 }) + 14;
    });
  }

  // Check page break for Section 3
  if (curY > doc.page.height - 180) {
    doc.addPage();
    curY = 50;
  }

  // Section: Technical Checks Overview
  doc.fillColor(COLOR_NAVY).fontSize(13).font('Helvetica-Bold').text('3. Technical Audit Checks Overview', 40, curY);
  curY += 20;

  checks.slice(0, 14).forEach((check) => {
    if (curY > doc.page.height - 70) {
      doc.addPage();
      curY = 50;
    }

    let statusText = 'PASS';
    let statusColor = '#10B981';
    if (check.result === 'failed') {
      statusText = 'FAIL';
      statusColor = '#EF4444';
    } else if (check.result === 'warning') {
      statusText = 'WARN';
      statusColor = '#F59E0B';
    } else if (check.result === 'unable_to_assess') {
      statusText = 'N/A';
      statusColor = '#94A3B8';
    }

    doc.rect(40, curY, 35, 14).fill(statusColor);
    doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold').text(statusText, 40, curY + 3, { width: 35, align: 'center' });

    doc.fillColor(COLOR_NAVY).fontSize(8.5).font('Helvetica-Bold').text(check.checkName, 85, curY + 2);
    doc.fillColor(COLOR_MUTED).fontSize(8).font('Helvetica').text(`Category: ${check.category}`, doc.page.width - 160, curY + 2, { align: 'right' });

    curY += 18;
  });

  // Disclaimer / Limitations
  if (curY > doc.page.height - 100) {
    doc.addPage();
    curY = 50;
  }

  curY += 15;
  doc.rect(40, curY, doc.page.width - 80, 50).fill('#F8FAFC').stroke('#CBD5E1');
  doc.fillColor('#64748B').fontSize(7).font('Helvetica-Bold').text('ASSESSMENT LIMITATIONS & LEGAL DISCLAIMER:', 48, curY + 8);
  doc.font('Helvetica').text(
    'This report contains findings from automated, non-invasive passive assessments. It does not exploit weaknesses, inject payloads, or test for unauthorized data exfiltration. The assessment results represent a point-in-time snapshot. SentinelScan assumes no liability for configuration omissions or subsequent changes made to the evaluated host.',
    48,
    curY + 20,
    { width: doc.page.width - 96, lineGap: 1.5 }
  );

  // Footer on all pages
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text(
      `SentinelScan Security Platform  |  Confidential  |  Page ${i + 1} of ${totalPages}`,
      40,
      doc.page.height - 30,
      { width: doc.page.width - 80, align: 'center' }
    );
  }

  doc.end();
}

module.exports = {
  generatePDFReport,
};
