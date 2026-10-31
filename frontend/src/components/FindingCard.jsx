import React, { useState } from 'react';

export default function FindingCard({ finding }) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityPill = (sev) => {
    const s = (sev || '').toLowerCase();
    return `severity-pill ${s}`;
  };

  return (
    <div className="finding-item">
      <div
        className="finding-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
      >
        <div className="d-flex align-items-center gap-3 text-truncate">
          <span className={getSeverityPill(finding.severity)}>
            {finding.severity}
          </span>
          <span className="badge bg-secondary bg-opacity-25 font-mono text-cyan small d-none d-sm-inline">
            {(finding.category || 'general').toUpperCase()}
          </span>
          <span className="fw-semibold text-light text-truncate">
            {finding.title}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2 text-muted ms-2">
          <span className="small d-none d-md-inline">{expanded ? 'Hide Details' : 'View Fix'}</span>
          <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
        </div>
      </div>

      {expanded && (
        <div className="finding-body">
          <div className="text-secondary mb-2">
            <strong className="text-light">Vulnerability Impact:</strong> {finding.description}
          </div>

          {finding.evidence && (
            <div>
              <div className="small font-mono text-muted mb-1">AUDIT EVIDENCE & DETECTED STATE:</div>
              <div className="evidence-block">
                <code>{finding.evidence}</code>
              </div>
            </div>
          )}

          <div className="remediation-block">
            <div className="d-flex align-items-center gap-2 mb-1 fw-bold text-info">
              <i className="bi bi-tools"></i> RECOMMENDED REMEDIATION:
            </div>
            <div>{finding.recommendation}</div>
          </div>
        </div>
      )}
    </div>
  );
}
