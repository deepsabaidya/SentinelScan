import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import WebsiteCard from '../components/WebsiteCard';

export default function Websites() {
  const [websites, setWebsites] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scanningId, setScanningId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const navigate = useNavigate();

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getWebsites();
      setWebsites(res?.data?.websites || []);
    } catch (err) {
      setError(err.message || 'Failed to load registered websites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      const res = await api.registerWebsite(urlInput.trim());
      setSuccessMsg(`Successfully registered ${res.data.website.domain} in your portfolio.`);
      setUrlInput('');
      setShowAddForm(false);
      fetchWebsites();
    } catch (err) {
      setError(err.message || 'Failed to register website.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLaunchScan = async (websiteId) => {
    try {
      setScanningId(websiteId);
      setError(null);
      const res = await api.createAssessment(websiteId);
      const assessmentId = res.data.assessment._id;
      navigate(`/assessments/${assessmentId}`);
    } catch (err) {
      setError(err.message || 'Assessment execution failed. Target may be unreachable.');
      setScanningId(null);
    }
  };

  const handleDelete = async (websiteId) => {
    if (!window.confirm('Are you sure you want to delete this website and all associated assessment records?')) {
      return;
    }

    try {
      await api.deleteWebsite(websiteId);
      setSuccessMsg('Website and associated assessment records removed.');
      fetchWebsites();
    } catch (err) {
      setError(err.message || 'Failed to delete website.');
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Target Websites Portfolio</h2>
          <p className="text-muted small mb-0">
            Register and manage authorized public HTTP/HTTPS domains for passive vulnerability scanning.
          </p>
        </div>

        <button
          className="btn-cyber-primary btn-sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-circle-fill'}`}></i>
          <span>{showAddForm ? 'Cancel' : 'Register New Website'}</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-4 bg-danger bg-opacity-10 border border-danger text-danger">
          <i className="bi bi-shield-x flex-shrink-0 fs-5"></i>
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success py-2 small d-flex align-items-center gap-2 mb-4 bg-success bg-opacity-10 border border-success text-success">
          <i className="bi bi-check-circle-fill flex-shrink-0"></i>
          <div>{successMsg}</div>
        </div>
      )}

      {/* Add Website Collapsible Form */}
      {showAddForm && (
        <div className="cyber-card mb-4 border-info">
          <div className="cyber-card-accent-top"></div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold mb-0">Register New Authorized Website</h5>
            <span className="badge bg-dark text-cyan border border-info border-opacity-25 font-mono small">
              SSRF Protected
            </span>
          </div>

          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label className="form-label text-muted small text-uppercase font-mono">
                Website URL or Domain Name
              </label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-50 text-muted">
                  <i className="bi bi-globe"></i>
                </span>
                <input
                  type="text"
                  className="form-control cyber-input"
                  placeholder="https://example.com or sub.domain.org"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  required
                />
              </div>
              <div className="form-text text-muted small mt-2 d-flex align-items-center gap-1">
                <i className="bi bi-shield-lock text-cyan"></i>
                SentinelScan enforces strict server-side SSRF validation. Private IP ranges (127.0.0.1, 192.168.x, 10.x), cloud metadata (169.254.169.254), and internal subnets are automatically blocked.
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn-cyber-secondary btn-sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-cyber-primary btn-sm"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Validating & Registering...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-up-fill"></i>
                    <span>Register Website</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Websites Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info mb-3" role="status"></div>
          <div className="text-muted font-mono small">LOADING REGISTERED TARGETS...</div>
        </div>
      ) : websites.length === 0 ? (
        <div className="cyber-card text-center py-5">
          <div className="stat-card-icon mx-auto mb-3" style={{ width: '60px', height: '60px', fontSize: '1.8rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#00e5ff' }}>
            <i className="bi bi-globe-americas"></i>
          </div>
          <h4 className="fw-bold text-light mb-1">No Registered Websites Found</h4>
          <p className="text-muted small mb-4" style={{ maxWidth: '420px', margin: '0 auto' }}>
            Register your first target website to begin automated passive security posture checks.
          </p>
          <button
            className="btn-cyber-primary btn-sm"
            onClick={() => setShowAddForm(true)}
          >
            <i className="bi bi-plus-circle-fill"></i> Register Target Website
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {websites.map((site) => (
            <div key={site._id} className="col-md-6 col-xl-4">
              <WebsiteCard
                website={site}
                onScan={handleLaunchScan}
                onDelete={handleDelete}
                isScanning={scanningId === site._id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
