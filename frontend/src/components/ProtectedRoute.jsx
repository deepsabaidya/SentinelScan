import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-primary-custom" style={{ backgroundColor: '#070d19' }}>
        <div className="text-center">
          <div className="spinner-border text-info mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading session...</span>
          </div>
          <div className="text-muted font-mono small">VERIFYING SENTINEL AUTHENTICATION...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
