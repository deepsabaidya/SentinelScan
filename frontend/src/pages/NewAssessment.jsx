import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function NewAssessment() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [mode, setMode] = useState('existing'); // 'existing' | 'quick'
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const scanSteps = [
    'Enforcing SSRF Protection & Resolving Target DNS...',
    'Performing TLS Handshake & Validating X.509 Certificate Chain...',
    'Analyzing HTTP-to-HTTPS Redirection Behavior on Port 80...',
    'Evaluating Modern HTTP Response Security Headers (CSP, HSTS, XFO)...',
    'Auditing Passive Cookie Directives (Secure, HttpOnly, SameSite)...',
    'Computing Deterministic Security Score & Persisting to MongoDB Atlas...',
  ];

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await api.getWebsites();
        const list = res?.data?.websites || [];
        setWebsites(list);
        if (list.length > 0) {
          setSelectedWebsiteId(list[0]._id);
        } else {
          setMode('quick');
        }
      } catch (err) {
        console.error('Failed to load websites:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  const handleStartScan = async (e) => {
    e.preventDefault();
    setError(null);

    let targetWebsiteId = selectedWebsiteId;

    try {
      setIsScanning(true);
      setScanStep(0);

      // Advance step indicator every 1.5s for vivid visual feedback
      const stepInterval = setInterval(() => {
        setScanStep((prev) => (prev < scanSteps.length - 1 ? prev + 1 : prev));
      }, 1400);

      // If quick mode, register first
      if (mode === 'quick') {
        if (!customUrl.trim()) {
          clearInterval(stepInterval);
          setIsScanning(false);
          setError('Please provide a target URL.');
          return;
        }
        const regRes = await api.registerWebsite(customUrl.trim());
        targetWebsiteId = regRes.data.website._id;
      }

      if (!targetWebsiteId) {
        clearInterval(stepInterval);
        setIsScanning(false);
        setError('Please select or register a website target.');
        return;
      }

      // Launch assessment
      const res = await api.createAssessment(targetWebsiteId);
      clearInterval(stepInterval);

      // Small delay to let user see final step
      setTimeout(() => {
        navigate(`/assessments/${res.data.assessment._id}`);
      }, 600);
    } catch (err) {
      setIsScanning(false);
      setError(err.message || 'Security assessment failed. Verify the target is reachable.');
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div className="text-center mb-4">
        <div className="brand-icon-shield mx-auto mb-3" style={{ width: '48px', height: '48px' }}>
          <i className="bi bi-shield-plus fs-3"></i>
        </div>
        <h2 className="fw-bold mb-1">Launch Security Assessment</h2>
        <p className="text-muted small">
          Conduct an authorized, non-invasive passive audit across headers, TLS, cookies, and DNS.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger py-2.5 small d-flex align-items-center gap-2 mb-4 bg-danger bg-opacity-10 border border-danger text-danger">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0 fs-5"></i>
          <div>{error}</div>
        </div>
      )}

      {isScanning ? (
        <div className="cyber-card p-5 text-center">
          <div className="cyber-card-accent-top"></div>
          <div className="spinner-border text-info mb-4" style={{ width: '4rem', height: '4rem' }} role="status">
            <span className="visually-hidden">Scanning...</span>
          </div>

          <h4 className="fw-bold text-light mb-2">Executing Security Assessment Engine</h4>
          <div className="text-cyan font-mono small mb-4 pulse-cyber">
            <i className="bi bi-broadcast me-2"></i>
            {scanSteps[scanStep]}
          </div>

          <div className="progress mb-3" style={{ height: '8px', backgroundColor: '#070d19' }}>
            <div
              className="progress-bar progress-bar-striped progress-bar-animated bg-info"
              style={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
            ></div>
          </div>

          <div className="text-muted small font-mono">
            STAGE {scanStep + 1} OF {scanSteps.length} &bull; SAFE PASSIVE AUDIT
          </div>
        </div>
      ) : (
        <div className="cyber-card p-4 p-md-5">
          <div className="cyber-card-accent-top"></div>

          <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
            <button
              type="button"
              className={`btn btn-sm ${mode === 'existing' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}
              onClick={() => setMode('existing')}
              disabled={websites.length === 0}
            >
              Select Registered Website ({websites.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'quick' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}
              onClick={() => setMode('quick')}
            >
              Scan New Website URL
            </button>
          </div>

          <form onSubmit={handleStartScan}>
            {mode === 'existing' ? (
              <div className="mb-4">
                <label className="form-label text-muted small text-uppercase font-mono">
                  Target Registered Domain
                </label>
                <select
                  className="form-select cyber-input"
                  value={selectedWebsiteId}
                  onChange={(e) => setSelectedWebsiteId(e.target.value)}
                  required
                >
                  {websites.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.domain} ({w.url})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-4">
                <label className="form-label text-muted small text-uppercase font-mono">
                  Target Website URL
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary border-opacity-50 text-muted">
                    <i className="bi bi-link-45deg"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control cyber-input"
                    placeholder="https://example.com"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Assessment Scope Notice */}
            <div className="p-3 rounded border border-secondary border-opacity-25 bg-dark mb-4 small">
              <div className="fw-bold text-light mb-1 d-flex align-items-center gap-2">
                <i className="bi bi-shield-check text-cyan"></i>
                Authorized Passive Audit Scope:
              </div>
              <ul className="text-muted mb-0 ps-3">
                <li>HTTP Security Headers: CSP, HSTS, XCTO, XFO, Referrer & Permissions Policy</li>
                <li>SSL/TLS Certificate Validity, Expiry & SANs Matching on Port 443</li>
                <li>HTTP-to-HTTPS Redirection on Port 80</li>
                <li>DNS Records (A, AAAA, MX, NS Redundancy, SPF & DMARC)</li>
                <li>Cookie Attributes (Secure, HttpOnly, SameSite)</li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn-cyber-primary w-100 justify-content-center py-3 fs-6"
              disabled={loading}
            >
              <i className="bi bi-play-circle-fill fs-5"></i>
              <span>Launch Automated Assessment</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
