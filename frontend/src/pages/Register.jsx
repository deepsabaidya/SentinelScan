import React from 'react';
import { Link } from 'react-router-dom';
import RegistrationForm from '../components/RegistrationForm';

export default function Register() {
  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4 position-relative"
      style={{
        backgroundColor: '#070d19',
        background: 'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.05) 0%, transparent 60%)',
      }}
    >
      <div className="mb-4 text-center">
        <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2">
          <div className="brand-icon-shield" style={{ width: '32px', height: '32px' }}>
            <i className="bi bi-shield-shaded"></i>
          </div>
          <span className="brand-text fs-4">SENTINEL<span>SCAN</span></span>
        </Link>
      </div>

      <RegistrationForm />

      <div className="mt-4 text-center text-muted small">
        <Link to="/" className="text-muted text-decoration-none">
          <i className="bi bi-arrow-left me-1"></i> Back to Homepage
        </Link>
      </div>
    </div>
  );
}
