import React from 'react';
import { Link } from 'react-router-dom';

export default function AssessmentTable({ assessments = [], onDelete, onDownloadPDF }) {
  const getGradeBadge = (score, grade) => {
    if (score >= 90) return 'bg-success text-success bg-opacity-25 border border-success';
    if (score >= 75) return 'bg-info text-info bg-opacity-25 border border-info';
    if (score >= 60) return 'bg-warning text-warning bg-opacity-25 border border-warning';
    return 'bg-danger text-danger bg-opacity-25 border border-danger';
  };

  if (!assessments || assessments.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-inbox text-muted fs-1 mb-2"></i>
        <div className="text-light fw-bold">No Assessment Records Found</div>
        <div className="text-muted small">Register a domain and launch an audit to generate assessment history.</div>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="cyber-table">
        <thead>
          <tr>
            <th>Target Domain</th>
            <th>Security Score</th>
            <th>Grade</th>
            <th>Critical / High</th>
            <th>Status</th>
            <th>Audit Timestamp</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map((a) => (
            <tr key={a._id}>
              <td>
                <div className="fw-semibold text-light">{a.targetDomain}</div>
                <div className="text-muted small text-truncate" style={{ maxWidth: '180px' }}>
                  {a.targetUrl}
                </div>
              </td>
              <td>
                <span className="font-heading fw-bold fs-5 text-light">{a.securityScore}</span>
                <span className="text-muted small"> / 100</span>
              </td>
              <td>
                <span className={`badge rounded-pill px-2.5 py-1.5 ${getGradeBadge(a.securityScore, a.securityGrade)}`}>
                  {a.securityGrade || 'N/A'}
                </span>
              </td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-danger bg-opacity-25 text-danger font-mono">
                    {a.summary?.critical || 0} Crit
                  </span>
                  <span className="badge bg-warning bg-opacity-25 text-warning font-mono">
                    {a.summary?.high || 0} High
                  </span>
                </div>
              </td>
              <td>
                <span className={`badge bg-${a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'info' : 'danger'} bg-opacity-25 text-${a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'info' : 'danger'}`}>
                  {a.status.toUpperCase()}
                </span>
              </td>
              <td className="text-muted small font-mono">
                {a.completedAt
                  ? new Date(a.completedAt).toLocaleString()
                  : new Date(a.createdAt).toLocaleString()}
              </td>
              <td className="text-end">
                <div className="d-inline-flex gap-2">
                  <Link
                    to={`/assessments/${a._id}`}
                    className="btn btn-sm btn-outline-info"
                    title="View Comprehensive Results"
                  >
                    <i className="bi bi-eye"></i> Details
                  </Link>

                  {onDownloadPDF && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => onDownloadPDF(a._id, a.targetDomain)}
                      title="Download PDF Audit Report"
                    >
                      <i className="bi bi-file-earmark-pdf"></i>
                    </button>
                  )}

                  {onDelete && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(a._id)}
                      title="Delete Record"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
