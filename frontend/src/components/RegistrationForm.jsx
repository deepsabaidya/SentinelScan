import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RegistrationForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. The email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-card p-4 p-md-5" style={{ maxWidth: '460px', width: '100%', margin: '0 auto' }}>
      <div className="cyber-card-accent-top"></div>
      <div className="text-center mb-4">
        <div className="brand-icon-shield mx-auto mb-3" style={{ width: '48px', height: '48px' }}>
          <i className="bi bi-person-badge-fill fs-3"></i>
        </div>
        <h3 className="fw-bold mb-1">Create Analyst Account</h3>
        <p className="text-muted small">Register to start passive security assessments</p>
      </div>

      {error && (
        <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3 bg-danger bg-opacity-10 border border-danger text-danger">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label text-muted small text-uppercase font-mono">Full Name</label>
          <div className="input-group">
            <span className="input-group-text bg-dark border-secondary border-opacity-50 text-muted">
              <i className="bi bi-person"></i>
            </span>
            <input
              type="text"
              className="form-control cyber-input"
              placeholder="Alex Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label text-muted small text-uppercase font-mono">Email Address</label>
          <div className="input-group">
            <span className="input-group-text bg-dark border-secondary border-opacity-50 text-muted">
              <i className="bi bi-envelope"></i>
            </span>
            <input
              type="email"
              className="form-control cyber-input"
              placeholder="alex@cybersecurity.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label text-muted small text-uppercase font-mono">Password (min 6 chars)</label>
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

        <div className="mb-4">
          <label className="form-label text-muted small text-uppercase font-mono">Confirm Password</label>
          <div className="input-group">
            <span className="input-group-text bg-dark border-secondary border-opacity-50 text-muted">
              <i className="bi bi-shield-check"></i>
            </span>
            <input
              type="password"
              className="form-control cyber-input"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              <span>Registering Profile...</span>
            </>
          ) : (
            <>
              <i className="bi bi-person-check-fill"></i>
              <span>Complete Registration</span>
            </>
          )}
        </button>

        <div className="text-center text-muted small">
          Already have an account?{' '}
          <Link to="/login" className="text-info text-decoration-none fw-semibold">
            Sign In Here
          </Link>
        </div>
      </form>
    </div>
  );
}
