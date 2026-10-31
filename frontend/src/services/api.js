/**
 * SentinelScan API Service Client
 * Uses native fetch API with automatic JWT Bearer token injection and error handling
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to get the saved JWT token from localStorage
 */
function getToken() {
  return localStorage.getItem('sentinel_token');
}

/**
 * Universal JSON fetcher with authorization header
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    // If token expired, clear local storage
    if (response.status === 401 && endpoint !== '/auth/login') {
      localStorage.removeItem('sentinel_token');
      localStorage.removeItem('sentinel_user');
    }
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Authentication
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  getMe: () => request('/auth/me'),

  // Website Management
  getWebsites: () => request('/websites'),

  registerWebsite: (url) =>
    request('/websites', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  deleteWebsite: (id) =>
    request(`/websites/${id}`, {
      method: 'DELETE',
    }),

  // Assessments
  createAssessment: (websiteId) =>
    request('/assessments', {
      method: 'POST',
      body: JSON.stringify({ websiteId }),
    }),

  getAssessments: (websiteId) =>
    request(`/assessments${websiteId ? `?websiteId=${websiteId}` : ''}`),

  getAssessmentById: (id) => request(`/assessments/${id}`),

  deleteAssessment: (id) =>
    request(`/assessments/${id}`, {
      method: 'DELETE',
    }),

  // Dashboard Stats & Visualizations
  getDashboardStats: () => request('/dashboard/stats'),
  getDashboardHistory: () => request('/dashboard/history'),
  getSeverityDistribution: () => request('/dashboard/severity'),

  // Health & Diagnostics
  getHealth: () => request('/health'),

  // Report Downloads (Blob streaming for PDF & CSV)
  downloadPDF: async (assessmentId, filename = 'SentinelScan-Report.pdf') => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/reports/${assessmentId}/pdf`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to download PDF report');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadCSV: async (assessmentId, filename = 'SentinelScan-Findings.csv') => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/reports/${assessmentId}/csv`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to download CSV findings');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
