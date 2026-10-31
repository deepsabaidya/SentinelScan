import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import DashboardCard from '../components/DashboardCard';
import SeverityChart from '../components/SeverityChart';
import AssessmentHistoryChart from '../components/AssessmentHistoryChart';
import SecurityScoreCard from '../components/SecurityScoreCard';
import AssessmentTable from '../components/AssessmentTable';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [distribution, setDistribution] = useState({});
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, historyRes, severityRes, assessmentsRes] = await Promise.all([
        api.getDashboardStats().catch(() => ({ data: {} })),
        api.getDashboardHistory().catch(() => ({ data: { history: [] } })),
        api.getSeverityDistribution().catch(() => ({ data: { distribution: {} } })),
        api.getAssessments().catch(() => ({ data: { assessments: [] } })),
      ]);

      setStats(statsRes?.data || {});
      setHistory(historyRes?.data?.history || []);
      setDistribution(severityRes?.data?.distribution || {});
      setRecentAssessments(assessmentsRes?.data?.assessments?.slice(0, 5) || []);
    } catch (err) {
      setError(err.message || 'Error loading dashboard metrics from MongoDB Atlas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownloadPDF = async (assessmentId, domain) => {
    try {
      await api.downloadPDF(assessmentId, `SentinelScan-${domain}-${assessmentId}.pdf`);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="text-center">
          <div className="spinner-border text-info mb-3" role="status"></div>
          <div className="text-muted font-mono small">QUERYING MONGODB ATLAS TELEMETRY...</div>
        </div>
      </div>
    );
  }

  const latest = stats?.latestAssessment;

  return (
    <div>
      {/* Dashboard Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Security Posture Dashboard</h2>
          <p className="text-muted small mb-0">
            Real-time vulnerability telemetry aggregated from MongoDB Atlas cloud records.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link to="/websites" className="btn-cyber-secondary btn-sm">
            <i className="bi bi-globe"></i> Manage Websites
          </Link>
          <Link to="/assessments/new" className="btn-cyber-primary btn-sm">
            <i className="bi bi-shield-plus"></i> New Assessment
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning py-2 small d-flex align-items-center gap-2 mb-4 bg-warning bg-opacity-10 border border-warning text-warning">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{error}</div>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Registered Websites"
            value={stats?.totalWebsites ?? 0}
            icon="bi-globe2"
            color="info"
            subtitle="Targets in your portfolio"
            badgeText="CLOUD PERSISTED"
            badgeType="info"
          />
        </div>

        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Total Assessments"
            value={stats?.totalAssessments ?? 0}
            icon="bi-shield-check"
            color="primary"
            subtitle="Completed passive scans"
            badgeText="PASSIVE ENGINE"
            badgeType="primary"
          />
        </div>

        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Avg Security Score"
            value={`${stats?.averageScore ?? 0}/100`}
            icon="bi-speedometer2"
            color={stats?.averageScore >= 75 ? 'success' : stats?.averageScore >= 60 ? 'warning' : 'danger'}
            subtitle={stats?.averageScore >= 75 ? 'Healthy posture' : 'Review remediations'}
            badgeText="WEIGHTED METRIC"
            badgeType="info"
          />
        </div>

        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Critical & High Risks"
            value={(stats?.criticalFindings ?? 0) + (stats?.highFindings ?? 0)}
            icon="bi-exclamation-octagon-fill"
            color="danger"
            subtitle={`${stats?.criticalFindings ?? 0} Critical, ${stats?.highFindings ?? 0} High`}
            badgeText="ACTION REQUIRED"
            badgeType="danger"
          />
        </div>
      </div>

      {/* Visualizations Row */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="cyber-card h-100">
            <div className="cyber-card-accent-top"></div>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="fw-bold mb-0">Security Score History</h5>
                <span className="text-muted small">Timeline of assessment score variations</span>
              </div>
              <span className="badge bg-dark text-cyan border border-info border-opacity-25 font-mono small">
                Chart.js Visualizer
              </span>
            </div>
            <AssessmentHistoryChart history={history} />
          </div>
        </div>

        <div className="col-lg-4">
          <div className="cyber-card h-100">
            <div className="cyber-card-accent-top"></div>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="fw-bold mb-0">Severity Distribution</h5>
                <span className="text-muted small">Active findings by risk tier</span>
              </div>
            </div>
            <SeverityChart distribution={distribution} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Latest Assessment Spotlight & Recent Table */}
      <div className="row g-4">
        {latest && (
          <div className="col-lg-4">
            <div className="cyber-card h-100">
              <div className="cyber-card-accent-top"></div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="stat-card-label text-info">Latest Scan Spotlight</span>
                <span className="badge bg-secondary font-mono small">{latest.targetDomain}</span>
              </div>
              <SecurityScoreCard
                score={latest.securityScore}
                grade={latest.securityGrade}
                breakdown={latest.summary ? {
                  headers: Math.round(((latest.summary.passedChecks || 0) / 14) * 30),
                  tlsAndHttps: Math.round(((latest.summary.passedChecks || 0) / 14) * 35),
                  cookies: 12,
                  dns: 18,
                } : null}
              />
              <div className="text-center mt-3">
                <Link to={`/assessments/${latest._id}`} className="btn-cyber-primary btn-sm w-100 justify-content-center">
                  <i className="bi bi-arrow-right-circle"></i> Inspect Full Audit Findings
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className={latest ? 'col-lg-8' : 'col-12'}>
          <div className="cyber-card h-100">
            <div className="cyber-card-accent-top"></div>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="fw-bold mb-0">Recent Assessments</h5>
                <span className="text-muted small">Latest security audit records</span>
              </div>
              <Link to="/history" className="btn-cyber-secondary btn-sm">
                View All History
              </Link>
            </div>
            <AssessmentTable
              assessments={recentAssessments}
              onDownloadPDF={handleDownloadPDF}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
