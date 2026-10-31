import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide your email address and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-card p-4 p-md-5" style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
      <div className="cyber-card-accent-top"></div>
      <div className="text-center mb-4">
        <div className="brand-icon-shield mx-auto mb-3" style={{ width: '48px', height: '48px' }}>
          <i className="bi bi-shield-lock-fill fs-3"></i>
        </div>
        <h3 className="fw-bold mb-1">Access SentinelScan</h3>
        <p className="text-muted small">Sign in to your security intelligence dashboard</p>
      </div>

      {error && (
        <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3 bg-danger bg-opacity-10 border border-danger text-danger">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label text-muted small text-uppercase font-mono">Work Email</label>
          <div className="input-group">
            <span className="input-group-text bg-dark border-secondary border-opacity-50 text-muted">
              <i className="bi bi-envelope"></i>
            </span>
            <input
              type="email"
              className="form-control cyber-input"
              placeholder="analyst@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label text-muted small text-uppercase font-mono mb-0">Password</label>
          </div>
          <div className="input-group">
            <span className="input-group-text bg-dark border-secondary border-opacity-50 text-muted">
              <i className="bi bi-key"></i>
            </span>
            <input
              type="password"
              className="form-control cyber-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-cyber-primary w-100 justify-content-center py-2.5 mb-3"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <i className="bi bi-box-arrow-in-right"></i>
              <span>Secure Sign In</span>
            </>
          )}
        </button>

        <div className="text-center text-muted small">
          New to SentinelScan?{' '}
          <Link to="/register" className="text-info text-decoration-none fw-semibold">
            Create an Account
          </Link>
        </div>
      </form>
    </div>
  );
}
