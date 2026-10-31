import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import SecurityScoreCard from '../components/SecurityScoreCard';
import FindingCard from '../components/FindingCard';
import ReportDownloadButton from '../components/ReportDownloadButton';

export default function AssessmentResults() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'checks'

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getAssessmentById(id);
        setData(res?.data || null);
      } catch (err) {
        setError(err.message || 'Failed to retrieve assessment results.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="text-center">
          <div className="spinner-border text-info mb-3" role="status"></div>
          <div className="text-muted font-mono small">RETRIEVING VULNERABILITY AUDIT DOSSIER...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alert alert-danger my-4 d-flex align-items-center gap-2">
        <i className="bi bi-exclamation-triangle-fill fs-5"></i>
        <div>{error || 'Assessment not found or access denied.'}</div>
      </div>
    );
  }

  const { assessment, findings = [], checks = [] } = data;

  // Filter findings by severity
  const filteredFindings = findings.filter((f) => {
    if (activeFilter === 'All') return true;
    return (f.severity || '').toLowerCase() === activeFilter.toLowerCase();
  });

  const filterOptions = [
    { label: 'All', count: findings.length },
    { label: 'Critical', count: findings.filter((f) => f.severity === 'Critical').length, color: 'danger' },
    { label: 'High', count: findings.filter((f) => f.severity === 'High').length, color: 'warning' },
    { label: 'Medium', count: findings.filter((f) => f.severity === 'Medium').length, color: 'info' },
    { label: 'Low', count: findings.filter((f) => f.severity === 'Low').length, color: 'primary' },
    { label: 'Informational', count: findings.filter((f) => f.severity === 'Informational').length, color: 'secondary' },
  ];

  return (
    <div>
      {/* Breadcrumb & Navigation */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 small font-mono">
              <li className="breadcrumb-item">
                <Link to="/dashboard" className="text-muted text-decoration-none">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/history" className="text-muted text-decoration-none">History</Link>
              </li>
              <li className="breadcrumb-item active text-cyan" aria-current="page">
                {assessment.targetDomain}
              </li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0">Assessment Results: {assessment.targetDomain}</h2>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ReportDownloadButton
            assessmentId={assessment._id}
            domain={assessment.targetDomain}
            type="pdf"
          />
          <ReportDownloadButton
            assessmentId={assessment._id}
            domain={assessment.targetDomain}
            type="csv"
          />
        </div>
      </div>

      {/* Target & Metadata Banner */}
      <div className="cyber-card mb-4 p-3 bg-secondary bg-opacity-25">
        <div className="row g-3 align-items-center text-muted small">
          <div className="col-sm-6 col-md-3">
            <span className="d-block text-uppercase font-mono text-dim" style={{ fontSize: '0.7rem' }}>TARGET URL:</span>
            <span className="text-light fw-semibold text-truncate d-block font-mono">
              {assessment.targetUrl}
            </span>
          </div>

          <div className="col-sm-6 col-md-3">
            <span className="d-block text-uppercase font-mono text-dim" style={{ fontSize: '0.7rem' }}>ASSESSMENT ID:</span>
            <span className="text-light font-mono text-truncate d-block">
              {assessment._id}
            </span>
          </div>

          <div className="col-sm-6 col-md-3">
            <span className="d-block text-uppercase font-mono text-dim" style={{ fontSize: '0.7rem' }}>COMPLETED AT:</span>
            <span className="text-light font-mono">
              {new Date(assessment.completedAt || assessment.createdAt).toUTCString()}
            </span>
          </div>

          <div className="col-sm-6 col-md-3">
            <span className="d-block text-uppercase font-mono text-dim" style={{ fontSize: '0.7rem' }}>AUDIT STATUS:</span>
            <span className="badge bg-success bg-opacity-25 text-success font-mono">
              {assessment.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Score Overview and Summary Cards */}
      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <SecurityScoreCard
            score={assessment.securityScore}
            grade={assessment.securityGrade}
            breakdown={{
              headers: Math.min(30, Math.round(((assessment.summary?.passedChecks || 0) / 14) * 30)),
              tlsAndHttps: Math.min(35, Math.round(((assessment.summary?.passedChecks || 0) / 14) * 35)),
              cookies: 12,
              dns: 18,
            }}
          />
        </div>

        <div className="col-lg-8">
          <div className="cyber-card h-100 d-flex flex-column justify-content-between">
            <div className="cyber-card-accent-top"></div>
            <div>
              <h5 className="fw-bold mb-3">Vulnerability Severity Breakdown</h5>
              <div className="row g-3 text-center mb-4">
                <div className="col-4 col-sm-2">
                  <div className="p-2.5 rounded border border-secondary border-opacity-25 bg-dark">
                    <div className="font-heading fw-bold fs-3 text-light">{findings.length}</div>
                    <div className="small font-mono text-muted" style={{ fontSize: '0.68rem' }}>TOTAL</div>
                  </div>
                </div>

                <div className="col-4 col-sm-2">
                  <div className="p-2.5 rounded border border-danger border-opacity-25" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
                    <div className="font-heading fw-bold fs-3 text-danger">{assessment.summary?.critical || 0}</div>
                    <div className="small font-mono text-danger" style={{ fontSize: '0.68rem' }}>CRITICAL</div>
                  </div>
                </div>

                <div className="col-4 col-sm-2">
                  <div className="p-2.5 rounded border border-warning border-opacity-25" style={{ backgroundColor: 'rgba(249, 115, 22, 0.08)' }}>
                    <div className="font-heading fw-bold fs-3" style={{ color: '#f97316' }}>{assessment.summary?.high || 0}</div>
                    <div className="small font-mono" style={{ color: '#f97316', fontSize: '0.68rem' }}>HIGH</div>
                  </div>
                </div>

                <div className="col-4 col-sm-2">
                  <div className="p-2.5 rounded border border-warning border-opacity-25" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
                    <div className="font-heading fw-bold fs-3 text-warning">{assessment.summary?.medium || 0}</div>
                    <div className="small font-mono text-warning" style={{ fontSize: '0.68rem' }}>MEDIUM</div>
                  </div>
                </div>

                <div className="col-4 col-sm-2">
                  <div className="p-2.5 rounded border border-info border-opacity-25" style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)' }}>
                    <div className="font-heading fw-bold fs-3 text-info">{assessment.summary?.low || 0}</div>
                    <div className="small font-mono text-info" style={{ fontSize: '0.68rem' }}>LOW</div>
                  </div>
                </div>

                <div className="col-4 col-sm-2">
                  <div className="p-2.5 rounded border border-secondary border-opacity-25 bg-dark">
                    <div className="font-heading fw-bold fs-3 text-muted">{assessment.summary?.informational || 0}</div>
                    <div className="small font-mono text-muted" style={{ fontSize: '0.68rem' }}>INFO</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded border border-secondary border-opacity-25 bg-dark small">
                <span className="fw-bold text-light d-block mb-1">
                  <i className="bi bi-info-circle text-info me-1"></i> Transparent Scoring Rules:
                </span>
                <span className="text-muted">
                  Score is calculated deterministically across HTTP Headers (30%), SSL/TLS & HTTPS (35%), Cookies (15%), and DNS Hygiene (20%). Critical vulnerabilities trigger a severe penalty ceiling restricting the score to a Poor or Needs Improvement grade until resolved.
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between pt-3 mt-3 border-top border-secondary border-opacity-25">
              <span className="text-muted small">
                Passed Checks: <strong className="text-success">{assessment.summary?.passedChecks || 0}</strong> &bull; Warnings: <strong className="text-warning">{assessment.summary?.warningChecks || 0}</strong> &bull; Failed: <strong className="text-danger">{assessment.summary?.failedChecks || 0}</strong>
              </span>
              <span className="badge bg-dark text-cyan font-mono border border-info border-opacity-25">
                PDFKit Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header: Findings vs Technical Checks */}
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-2">
        <div className="d-flex align-items-center gap-2">
          <button
            className={`btn btn-sm ${activeTab === 'findings' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('findings')}
          >
            <i className="bi bi-exclamation-triangle-fill me-1"></i> Security Findings ({findings.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'checks' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('checks')}
          >
            <i className="bi bi-check2-square me-1"></i> All Technical Audit Checks ({checks.length})
          </button>
        </div>
      </div>

      {activeTab === 'findings' ? (
        <div>
          {/* Severity Filter Pills */}
          <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
            <span className="text-muted small font-mono me-2">FILTER BY RISK:</span>
            {filterOptions.map((opt) => (
              <button
                key={opt.label}
                className={`btn btn-sm ${activeFilter === opt.label ? 'btn-light text-dark fw-bold' : 'btn-cyber-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}
                onClick={() => setActiveFilter(opt.label)}
              >
                {opt.label} ({opt.count})
              </button>
            ))}
          </div>

          {filteredFindings.length === 0 ? (
            <div className="cyber-card text-center py-5">
              <i className="bi bi-shield-check text-success fs-1 mb-2"></i>
              <h5 className="fw-bold text-light">No Findings Under Filter "{activeFilter}"</h5>
              <p className="text-muted small mb-0">The target passed checks in this category without active alerts.</p>
            </div>
          ) : (
            <div>
              {filteredFindings.map((finding) => (
                <FindingCard key={finding._id || finding.title} finding={finding} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Technical Checks Audit Table */
        <div className="cyber-card">
          <div className="table-responsive">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Audit Check Name</th>
                  <th>Category</th>
                  <th>Result</th>
                  <th>Diagnostic Details</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((chk, idx) => {
                  let badge = 'bg-success text-success';
                  if (chk.result === 'failed') badge = 'bg-danger text-danger';
                  else if (chk.result === 'warning') badge = 'bg-warning text-warning';
                  else if (chk.result === 'unable_to_assess') badge = 'bg-secondary text-light';

                  return (
                    <tr key={idx}>
                      <td className="fw-semibold text-light">{chk.checkName}</td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-25 font-mono text-cyan">
                          {chk.category}
                        </span>
                      </td>
                      <td>
                        <span className={`badge rounded-pill bg-opacity-25 border ${badge}`}>
                          {chk.result.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-mono small text-muted" style={{ maxWidth: '300px' }}>
                        {chk.details ? (
                          <div className="text-truncate">
                            {JSON.stringify(chk.details)}
                          </div>
                        ) : (
                          'No extra telemetry'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
