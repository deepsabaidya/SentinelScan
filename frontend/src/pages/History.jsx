import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import AssessmentTable from '../components/AssessmentTable';

export default function History() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();

  const domainFilter = searchParams.get('domain');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAssessments();
      setAssessments(res?.data?.assessments || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve assessment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (domainFilter) {
      setSearchTerm(domainFilter);
    }
  }, [domainFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assessment record and associated findings permanently?')) {
      return;
    }

    try {
      await api.deleteAssessment(id);
      fetchHistory();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleDownloadPDF = async (id, domain) => {
    try {
      await api.downloadPDF(id, `SentinelScan-${domain}-${id}.pdf`);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (a.targetDomain || '').toLowerCase().includes(term) ||
      (a.targetUrl || '').toLowerCase().includes(term) ||
      (a.securityGrade || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Assessment Scan History</h2>
          <p className="text-muted small mb-0">
            Audit logs and historical security score tracking across all evaluated endpoints.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="input-group input-group-sm" style={{ width: '260px' }}>
            <span className="input-group-text bg-dark border-secondary border-opacity-50 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control cyber-input"
              placeholder="Search by domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-4 bg-danger bg-opacity-10 border border-danger text-danger">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{error}</div>
        </div>
      )}

      <div className="cyber-card">
        <div className="cyber-card-accent-top"></div>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info mb-3" role="status"></div>
            <div className="text-muted font-mono small">LOADING HISTORICAL LOGS FROM ATLAS...</div>
          </div>
        ) : (
          <AssessmentTable
            assessments={filteredAssessments}
            onDelete={handleDelete}
            onDownloadPDF={handleDownloadPDF}
          />
        )}
      </div>
    </div>
  );
}
