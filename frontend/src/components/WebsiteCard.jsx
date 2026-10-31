import React from 'react';
import { Link } from 'react-router-dom';

export default function WebsiteCard({ website, onScan, onDelete, isScanning = false }) {
  const getBadgeClass = (score) => {
    if (score === null || score === undefined) return 'bg-secondary text-light';
    if (score >= 90) return 'bg-success text-success bg-opacity-25 border border-success';
    if (score >= 75) return 'bg-info text-info bg-opacity-25 border border-info';
    if (score >= 60) return 'bg-warning text-warning bg-opacity-25 border border-warning';
    return 'bg-danger text-danger bg-opacity-25 border border-danger';
  };

  return (
    <div className="cyber-card h-100 d-flex flex-column justify-content-between">
      <div className="cyber-card-accent-top"></div>
      <div>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded p-2 d-flex align-items-center justify-content-center"
              style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#00e5ff' }}
            >
              <i className="bi bi-globe fs-5"></i>
            </div>
            <div>
              <h5 className="mb-0 text-truncate" style={{ maxWidth: '200px' }}>
                {website.domain}
              </h5>
              <a
                href={website.url}
                target="_blank"
                rel="noreferrer"
                className="text-muted small text-decoration-none text-truncate d-block"
                style={{ maxWidth: '200px' }}
              >
                {website.url} <i className="bi bi-box-arrow-up-right font-small"></i>
              </a>
            </div>
          </div>

          <span className={`badge rounded-pill px-3 py-2 ${getBadgeClass(website.lastScore)}`}>
            {website.lastScore !== null && website.lastScore !== undefined
              ? `${website.lastScore}/100 (${website.lastGrade})`
              : 'Unassessed'}
          </span>
        </div>

        <div className="bg-dark bg-opacity-50 p-2 rounded border border-secondary border-opacity-25 mb-3 small">
          <div className="d-flex justify-content-between text-muted">
            <span>Last Audit:</span>
            <span className="font-mono text-light">
              {website.lastAssessedAt
                ? new Date(website.lastAssessedAt).toLocaleDateString()
                : 'Never'}
            </span>
          </div>
          <div className="d-flex justify-content-between text-muted mt-1">
            <span>Registered:</span>
            <span className="font-mono text-light">
              {new Date(website.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 pt-2 border-top border-secondary border-opacity-25">
        <button
          className="btn-cyber-primary btn-sm flex-grow-1 justify-content-center"
          onClick={() => onScan(website._id)}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <i className="bi bi-play-circle-fill"></i>
              <span>Launch Audit</span>
            </>
          )}
        </button>

        <Link
          to={`/history?domain=${website.domain}`}
          className="btn-cyber-secondary btn-sm"
          title="View Historical Scans"
        >
          <i className="bi bi-clock-history"></i>
        </Link>

        <button
          className="btn-cyber-danger btn-sm"
          onClick={() => onDelete(website._id)}
          title="Delete Website"
        >
          <i className="bi bi-trash"></i>
        </button>
      </div>
    </div>
  );
}
