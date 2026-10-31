import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        setHealth(res);
      } catch (err) {
        setHealth({ status: 'offline', error: err.message });
      } finally {
        setLoadingHealth(false);
      }
    };
    checkHealth();
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Platform Settings & Environment Diagnostics</h2>
        <p className="text-muted small mb-0">
          User profile credentials, MongoDB Atlas cloud connectivity, and engine telemetry.
        </p>
      </div>

      <div className="row g-4">
        {/* User Profile Card */}
        <div className="col-lg-6">
          <div className="cyber-card h-100">
            <div className="cyber-card-accent-top"></div>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="brand-icon-shield" style={{ width: '48px', height: '48px' }}>
                <i className="bi bi-person-fill fs-3"></i>
              </div>
              <div>
                <h5 className="fw-bold text-light mb-0">{user?.name || 'Security Analyst'}</h5>
                <span className="text-muted small font-mono">{user?.email}</span>
              </div>
            </div>

            <div className="bg-dark bg-opacity-50 p-3 rounded border border-secondary border-opacity-25 mb-4">
              <div className="d-flex justify-content-between text-muted small mb-2">
                <span>Account Role:</span>
                <span className="text-info font-mono fw-semibold">Security Engineer / Analyst</span>
              </div>
              <div className="d-flex justify-content-between text-muted small mb-2">
                <span>Authentication Method:</span>
                <span className="text-light font-mono">JWT + bcrypt (SHA-256)</span>
              </div>
              <div className="d-flex justify-content-between text-muted small">
                <span>Account Created:</span>
                <span className="text-light font-mono">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Session'}
                </span>
              </div>
            </div>

            <div className="alert alert-info py-2 small bg-info bg-opacity-10 border border-info border-opacity-25 text-info">
              <i className="bi bi-shield-lock me-1"></i>
              Session tokens are cryptographically signed with HMAC-SHA256 and stored in secure browser storage.
            </div>
          </div>
        </div>

        {/* MongoDB Atlas Connectivity Diagnostic Card */}
        <div className="col-lg-6">
          <div className="cyber-card h-100">
            <div className="cyber-card-accent-top"></div>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold text-light mb-0">MongoDB Atlas Cloud Database</h5>
              {loadingHealth ? (
                <span className="spinner-border spinner-border-sm text-info"></span>
              ) : health?.database === 'connected' ? (
                <span className="badge bg-success bg-opacity-25 text-success border border-success">
                  <i className="bi bi-check-circle-fill me-1"></i> CLUSTER CONNECTED
                </span>
              ) : (
                <span className="badge bg-warning bg-opacity-25 text-warning border border-warning">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i> CONFIG CHECK
                </span>
              )}
            </div>

            <p className="text-muted small">
              All application entities (Users, Websites, Assessments, Findings, AssessmentChecks) persist in MongoDB Atlas cloud storage.
            </p>

            <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 small font-mono mb-3">
              <div className="text-cyan mb-1">Atlas Connection Configuration:</div>
              <div className="text-muted" style={{ wordBreak: 'break-all' }}>
                mongodb+srv://&lt;db_user&gt;:&lt;password&gt;@cluster0.abcde.mongodb.net/sentinelscan
              </div>
            </div>

            <div className="small text-muted">
              <div className="fw-bold text-light mb-1">Quick Setup Checklist:</div>
              <ul className="ps-3 mb-0">
                <li>Create free cluster M0 on <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" className="text-info">cloud.mongodb.com</a></li>
                <li>Add Database User under <strong>Security &gt; Database Access</strong></li>
                <li>Add <code>0.0.0.0/0</code> under <strong>Security &gt; Network Access</strong></li>
                <li>Set <code>MONGODB_URI</code> in your <code>.env</code> file</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Training & Academic Specification Card */}
        <div className="col-12">
          <div className="cyber-card">
            <div className="cyber-card-accent-top"></div>
            <h5 className="fw-bold text-light mb-2">
              <i className="bi bi-mortarboard-fill text-info me-2"></i>
              MCA Technical Training Specifications
            </h5>
            <div className="row g-3 small text-muted">
              <div className="col-md-4">
                <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100">
                  <div className="fw-bold text-light mb-1">Architecture</div>
                  <div>Three-Tier Decoupled Architecture (React SPA + Express REST API + MongoDB Atlas cloud database). Ready for Docker and VM virtualization.</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100">
                  <div className="fw-bold text-light mb-1">Safety Constraints</div>
                  <div>Strict passive audit. Zero invasive fuzzing, zero exploitation, zero denial of service, and strict SSRF + DNS rebinding guards.</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100">
                  <div className="fw-bold text-light mb-1">Reporting Standards</div>
                  <div>Boardroom PDFKit report generation and CSV data dumps with documented risk score weightings (0–100) and remediation.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
