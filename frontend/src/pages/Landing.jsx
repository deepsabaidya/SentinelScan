import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#070d19' }}>
      {/* Landing Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom border-secondary border-opacity-25 py-3 px-4 px-md-5" style={{ backgroundColor: '#0c1427' }}>
        <div className="container-fluid px-0">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
            <div className="brand-icon-shield">
              <i className="bi bi-shield-shaded"></i>
            </div>
            <div>
              <span className="brand-text">SENTINEL<span>SCAN</span></span>
            </div>
          </Link>

          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-cyber-primary btn-sm">
                <i className="bi bi-grid-fill"></i> Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-cyber-secondary btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn-cyber-primary btn-sm">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5 px-4 text-center position-relative overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 20%, rgba(0, 229, 255, 0.08) 0%, transparent 60%)' }}>
        <div className="container py-4">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-dark border border-info border-opacity-25 mb-4">
            <span className="badge bg-info text-dark font-mono">NEW v1.0</span>
            <span className="text-light small font-mono">MCA Technical Training Project | Cloud-Hosted MongoDB Atlas</span>
          </div>

          <h1 className="display-4 fw-bold mb-3" style={{ maxWidth: '850px', margin: '0 auto', letterSpacing: '-0.03em' }}>
            See Your Security. <br />
            <span style={{ color: '#00e5ff' }}>Strengthen Your Defences.</span>
          </h1>

          <p className="lead text-muted mb-4" style={{ maxWidth: '720px', margin: '0 auto', fontSize: '1.15rem' }}>
            SentinelScan provides automated, non-invasive passive security assessments for modern web applications. 
            Evaluate HTTP defense headers, SSL/TLS certificates, HTTPS redirections, DNS hygiene, and cookie flags with instant PDF audit reporting.
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn-cyber-primary py-3 px-4 fs-6">
              <i className="bi bi-shield-check fs-5"></i>
              <span>Launch Free Security Scan</span>
            </Link>
            <Link to={isAuthenticated ? '/websites' : '/login'} className="btn-cyber-secondary py-3 px-4 fs-6">
              <i className="bi bi-laptop fs-5"></i>
              <span>Live Demonstration</span>
            </Link>
          </div>

          {/* Interactive Hero Terminal Preview */}
          <div className="cyber-card text-start p-3 p-md-4 shadow-lg mx-auto" style={{ maxWidth: '880px', backgroundColor: '#0a1020', border: '1px solid rgba(0, 229, 255, 0.25)' }}>
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary border-opacity-25 mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="rounded-circle d-inline-block" style={{ width: '12px', height: '12px', backgroundColor: '#ef4444' }}></span>
                <span className="rounded-circle d-inline-block" style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b' }}></span>
                <span className="rounded-circle d-inline-block" style={{ width: '12px', height: '12px', backgroundColor: '#10b981' }}></span>
                <span className="ms-2 font-mono small text-muted">sentinelscan-audit-engine --passive --target https://target.domain</span>
              </div>
              <span className="badge bg-success bg-opacity-25 text-success font-mono small">ENGINE ONLINE</span>
            </div>

            <div className="font-mono small lh-base">
              <div className="text-muted"><span className="text-info">[+]</span> Resolving target DNS records (A, AAAA, MX, NS, TXT)... <span className="text-success">OK (2 NS found, SPF present)</span></div>
              <div className="text-muted"><span className="text-info">[+]</span> Performing TLS handshake on port 443 with SNI... <span className="text-success">TLSv1.3 Valid (274 days remaining)</span></div>
              <div className="text-muted"><span className="text-info">[+]</span> Testing HTTP port 80 automatic upgrade... <span className="text-success">301 Redirect to HTTPS</span></div>
              <div className="text-muted"><span className="text-info">[+]</span> Auditing HTTP response security headers... <span className="text-warning">CSP Missing (High Risk), HSTS Enforced</span></div>
              <div className="text-muted"><span className="text-info">[+]</span> Evaluating Set-Cookie directives... <span className="text-success">Secure, HttpOnly, SameSite=Lax</span></div>
              <div className="mt-2 text-cyan fw-bold"><i className="bi bi-check2-circle"></i> Security Assessment Finished: Score 86/100 (Grade: Good) | 1 High, 1 Low Finding</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Modules Grid */}
      <section className="py-5 px-4" style={{ backgroundColor: '#091022' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="stat-card-label text-info">Comprehensive Security Modules</span>
            <h2 className="fw-bold mt-1">Multi-Layer Passive Audit Engine</h2>
            <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Built according to university MCA practical requirements with modern industry defense standards.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className="cyber-card h-100">
                <div className="stat-card-icon mb-3" style={{ backgroundColor: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.25)' }}>
                  <i className="bi bi-layout-text-window-reverse"></i>
                </div>
                <h5 className="fw-bold text-light">HTTP Security Headers</h5>
                <p className="text-muted small">
                  Deep inspection of Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="cyber-card h-100">
                <div className="stat-card-icon mb-3" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <i className="bi bi-shield-lock"></i>
                </div>
                <h5 className="fw-bold text-light">SSL/TLS & Cipher Audit</h5>
                <p className="text-muted small">
                  Validates certificate chain of trust, expiry countdown, Certificate Authority, Subject Alternative Names (SANs) domain matching, and negotiated protocol version.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="cyber-card h-100">
                <div className="stat-card-icon mb-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <i className="bi bi-arrow-repeat"></i>
                </div>
                <h5 className="fw-bold text-light">HTTPS & Redirection</h5>
                <p className="text-muted small">
                  Tests plain HTTP port 80 behavior to ensure 301/308 permanent redirections to secure HTTPS, preventing SSL stripping and unencrypted eavesdropping.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="cyber-card h-100">
                <div className="stat-card-icon mb-3" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <i className="bi bi-diagram-3"></i>
                </div>
                <h5 className="fw-bold text-light">DNS Infrastructure & Spoofing</h5>
                <p className="text-muted small">
                  Inspects A, AAAA (IPv6 readiness), MX mail exchanges, NS redundancy, SPF anti-spoofing TXT records, and DMARC policy enforcement.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="cyber-card h-100">
                <div className="stat-card-icon mb-3" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.25)' }}>
                  <i className="bi bi-cookie"></i>
                </div>
                <h5 className="fw-bold text-light">Cookie Security Flags</h5>
                <p className="text-muted small">
                  Passively checks Set-Cookie headers for Secure flags, HttpOnly XSS protections, and SameSite CSRF defense attributes without touching browser sessions.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="cyber-card h-100">
                <div className="stat-card-icon mb-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <i className="bi bi-file-earmark-pdf"></i>
                </div>
                <h5 className="fw-bold text-light">Executive PDF & CSV Reports</h5>
                <p className="text-muted small">
                  Instantly compiles professional PDFKit reports complete with executive summaries, findings with remediation advice, and CSV data export for spreadsheets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-5 px-4 text-center">
        <div className="container py-4">
          <span className="stat-card-label text-info">Workflow</span>
          <h2 className="fw-bold mt-1 mb-5">How SentinelScan Operates</h2>

          <div className="row g-4 text-start">
            <div className="col-md-4">
              <div className="p-4 rounded border border-secondary border-opacity-25 bg-dark h-100">
                <div className="font-heading fw-bold fs-2 text-info mb-2">01</div>
                <h5 className="text-light fw-bold">Register Target Domain</h5>
                <p className="text-muted small mb-0">
                  Add the websites you own or manage. SentinelScan validates the URL and enforces SSRF security guards before queueing.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 rounded border border-secondary border-opacity-25 bg-dark h-100">
                <div className="font-heading fw-bold fs-2 text-info mb-2">02</div>
                <h5 className="text-light fw-bold">Automated Passive Audit</h5>
                <p className="text-muted small mb-0">
                  The engine initiates safe non-invasive checks against headers, SSL/TLS, DNS, and cookie directives in parallel.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 rounded border border-secondary border-opacity-25 bg-dark h-100">
                <div className="font-heading fw-bold fs-2 text-info mb-2">03</div>
                <h5 className="text-light fw-bold">View Score & Export</h5>
                <p className="text-muted small mb-0">
                  Analyze your score (0–100), review granular findings with evidence and remediation, and download PDF audit reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-4 px-4 border-top border-secondary border-opacity-25 text-center text-muted small" style={{ backgroundColor: '#070c17' }}>
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <div>
            <span className="fw-bold text-light">SentinelScan</span> &copy; 2026. MCA Technical Training Practical Project.
          </div>
          <div className="font-mono text-cyan">
            MongoDB Atlas Cloud Database &bull; Passive Security Engine
          </div>
        </div>
      </footer>
    </div>
  );
}
