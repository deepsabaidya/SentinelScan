import React from 'react';

export default function SecurityScoreCard({ score = 0, grade = 'Pending', breakdown = null }) {
  const getGradeColor = (g) => {
    switch (g) {
      case 'Excellent':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981' };
      case 'Good':
        return { color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.15)', border: '#00e5ff' };
      case 'Moderate':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' };
      case 'Needs Improvement':
        return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316' };
      case 'Poor':
      default:
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' };
    }
  };

  const gradeStyle = getGradeColor(grade);

  // SVG circular gauge calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="cyber-card text-center p-4">
      <div className="cyber-card-accent-top"></div>
      <h6 className="text-uppercase text-muted font-mono mb-3" style={{ fontSize: '0.8rem', letterSpacing: '0.08em' }}>
        SECURITY POSTURE SCORE
      </h6>

      <div className="score-circle-wrapper position-relative my-2">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth="10"
          />
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="transparent"
            stroke={gradeStyle.color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 75 75)"
            style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
          />
        </svg>

        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <div className="score-number">{score}</div>
          <div className="text-muted small" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>
            OUT OF 100
          </div>
        </div>
      </div>

      <div className="mt-3">
        <span
          className="score-grade-badge"
          style={{
            backgroundColor: gradeStyle.bg,
            color: gradeStyle.color,
            border: `1px solid ${gradeStyle.border}`,
          }}
        >
          {grade}
        </span>
      </div>

      {breakdown && (
        <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 text-start">
          <div className="d-flex justify-content-between small text-muted mb-1">
            <span>HTTP Security Headers</span>
            <span className="font-mono text-light">{breakdown.headers || 0} / 30 pts</span>
          </div>
          <div className="progress mb-2" style={{ height: '5px', backgroundColor: '#070d19' }}>
            <div
              className="progress-bar bg-info"
              style={{ width: `${((breakdown.headers || 0) / 30) * 100}%` }}
            ></div>
          </div>

          <div className="d-flex justify-content-between small text-muted mb-1">
            <span>SSL/TLS & HTTPS Redirection</span>
            <span className="font-mono text-light">{breakdown.tlsAndHttps || 0} / 35 pts</span>
          </div>
          <div className="progress mb-2" style={{ height: '5px', backgroundColor: '#070d19' }}>
            <div
              className="progress-bar bg-primary"
              style={{ width: `${((breakdown.tlsAndHttps || 0) / 35) * 100}%` }}
            ></div>
          </div>

          <div className="d-flex justify-content-between small text-muted mb-1">
            <span>Cookie Attributes Security</span>
            <span className="font-mono text-light">{breakdown.cookies || 0} / 15 pts</span>
          </div>
          <div className="progress mb-2" style={{ height: '5px', backgroundColor: '#070d19' }}>
            <div
              className="progress-bar bg-warning"
              style={{ width: `${((breakdown.cookies || 0) / 15) * 100}%` }}
            ></div>
          </div>

          <div className="d-flex justify-content-between small text-muted mb-1">
            <span>DNS Infrastructure & SPF/DMARC</span>
            <span className="font-mono text-light">{breakdown.dns || 0} / 20 pts</span>
          </div>
          <div className="progress" style={{ height: '5px', backgroundColor: '#070d19' }}>
            <div
              className="progress-bar bg-success"
              style={{ width: `${((breakdown.dns || 0) / 20) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
