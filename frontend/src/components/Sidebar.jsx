import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
    { to: '/websites', label: 'Websites Portfolio', icon: 'bi-globe2' },
    { to: '/assessments/new', label: 'New Assessment', icon: 'bi-shield-plus' },
    { to: '/history', label: 'Scan History', icon: 'bi-clock-history' },
    { to: '/reports', label: 'Security Reports', icon: 'bi-file-earmark-pdf-fill' },
    { to: '/settings', label: 'Platform Settings', icon: 'bi-gear-fill' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-lg-none"
          style={{ zIndex: 999 }}
          onClick={onClose}
        />
      )}

      <aside
        className={`cyber-sidebar ${isOpen ? 'show' : ''}`}
        style={{
          position: window.innerWidth < 992 ? 'fixed' : 'relative',
          height: '100vh',
          left: window.innerWidth < 992 && !isOpen ? '-280px' : 0,
        }}
      >
        <NavLink to="/dashboard" className="sidebar-brand">
          <div className="brand-icon-shield">
            <i className="bi bi-shield-shaded"></i>
          </div>
          <div>
            <div className="brand-text">
              SENTINEL<span>SCAN</span>
            </div>
            <div className="text-muted text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>
              Security Audit Engine
            </div>
          </div>
        </NavLink>

        <ul className="sidebar-nav">
          <li className="px-3 py-1 text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
            Core Modules
          </li>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `nav-link-cyber ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (onClose) onClose();
                }}
              >
                <i className={`bi ${item.icon} fs-5`}></i>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>ENGINE MODE:</span>
            <span className="badge bg-success bg-opacity-25 text-success font-mono" style={{ fontSize: '0.68rem' }}>PASSIVE / SAFE</span>
          </div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
            Version 1.0.0 (Production)
          </div>
        </div>
      </aside>
    </>
  );
}
