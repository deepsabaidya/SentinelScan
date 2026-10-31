import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ReportDownloadButton from '../components/ReportDownloadButton';

export default function Reports() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getAssessments();
        setAssessments(res?.data?.assessments || []);
      } catch (err) {
        setError(err.message || 'Failed to load report archives.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Security & Compliance Reports</h2>
        <p className="text-muted small mb-0">
          Export boardroom-ready PDF audit reports and raw CSV vulnerability datasets.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-4 bg-danger bg-opacity-10 border border-danger text-danger">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Report Info Banner */}
      <div className="cyber-card mb-4 p-4 border-info">
        <div className="cyber-card-accent-top"></div>
        <div className="row align-items-center g-3">
          <div className="col-lg-8">
            <h5 className="fw-bold text-light mb-1">
              <i className="bi bi-file-earmark-pdf text-info me-2"></i>
              Automated PDFKit Report Engine
            </h5>
            <p className="text-muted small mb-0">
              SentinelScan compiles executive security summaries, technical findings, evidence snippets, and actionable remediation steps into standardized, confidential PDF audit documents.
            </p>
          </div>
          <div className="col-lg-4 text-lg-end">
            <span className="badge bg-dark text-cyan border border-info border-opacity-25 font-mono p-2">
              <i className="bi bi-patch-check-fill text-info me-1"></i>
              ISO & OWASP Best Practices
            </span>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="cyber-card">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold mb-0">Available Audit Reports ({assessments.length})</h5>
          <span className="badge bg-secondary font-mono small">PDF & CSV EXPORT</span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info mb-3" role="status"></div>
            <div className="text-muted font-mono small">RETRIEVING REPORT INDEX FROM CLOUD...</div>
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-file-earmark-x fs-1 d-block mb-2 text-dim"></i>
            <div>No completed assessments available for reporting.</div>
            <div className="small">Run an assessment to generate your first PDF report.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Target Domain</th>
                  <th>Security Score</th>
                  <th>Grade</th>
                  <th>Findings Count</th>
                  <th>Assessment Date</th>
                  <th className="text-end">Download Format</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="fw-semibold text-light">{a.targetDomain}</div>
                      <div className="text-muted small font-mono">{a.targetUrl}</div>
                    </td>
                    <td>
                      <span className="font-heading fw-bold fs-5 text-light">{a.securityScore}</span>
                      <span className="text-muted small">/100</span>
                    </td>
                    <td>
                      <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25">
                        {a.securityGrade}
                      </span>
                    </td>
                    <td>
                      <span className="text-light fw-semibold">{a.summary?.totalFindings || 0}</span>
                      <span className="text-muted small"> issues identified</span>
                    </td>
                    <td className="font-mono text-muted small">
                      {new Date(a.completedAt || a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <ReportDownloadButton
                          assessmentId={a._id}
                          domain={a.targetDomain}
                          type="pdf"
                        />
                        <ReportDownloadButton
                          assessmentId={a._id}
                          domain={a.targetDomain}
                          type="csv"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
