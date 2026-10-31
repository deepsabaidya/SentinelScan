import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="cyber-navbar">
      <div className="d-flex align-items-center gap-3">
        {onToggleSidebar && (
          <button
            className="btn btn-sm btn-outline-secondary d-lg-none"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
          >
            <i className="bi bi-list fs-5"></i>
          </button>
        )}
        <div className="d-none d-md-flex align-items-center gap-2">
          <span className="badge rounded-pill bg-dark text-cyan border border-info border-opacity-25 py-2 px-3">
            <i className="bi bi-cloud-check-fill text-info me-2"></i>
            MongoDB Atlas Connected
          </span>
          <span className="text-muted small">| MCA Technical Training</span>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        {isAuthenticated ? (
          <div className="dropdown">
            <button
              className="user-badge text-decoration-none border-0 dropdown-toggle text-start"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ cursor: 'pointer' }}
            >
              <div className="user-avatar-circle">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="d-none d-sm-block">
                <div className="fw-semibold text-light small lh-1">{user?.name || 'Security Analyst'}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>{user?.email}</div>
              </div>
            </button>
            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark shadow border-secondary mt-2">
              <li>
                <Link className="dropdown-item py-2" to="/settings">
                  <i className="bi bi-gear me-2 text-info"></i> Security Settings
                </Link>
              </li>
              <li><hr className="dropdown-divider border-secondary" /></li>
              <li>
                <button className="dropdown-item py-2 text-danger" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i> Sign Out
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <Link to="/login" className="btn-cyber-secondary btn-sm">
              Log In
            </Link>
            <Link to="/register" className="btn-cyber-primary btn-sm">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
