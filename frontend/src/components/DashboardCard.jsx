import React from 'react';

export default function DashboardCard({
  title,
  value,
  icon = 'bi-shield-check',
  color = 'info',
  subtitle,
  badgeText,
  badgeType = 'info',
}) {
  const colorMap = {
    info: { text: '#00e5ff', bg: 'rgba(0, 229, 255, 0.1)', border: 'rgba(0, 229, 255, 0.25)' },
    primary: { text: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.25)' },
    danger: { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)' },
    warning: { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
    success: { text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' },
  };

  const scheme = colorMap[color] || colorMap.info;

  return (
    <div className="cyber-card h-100">
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <span className="stat-card-label">{title}</span>
          <div className="stat-card-value">{value}</div>
          {subtitle && (
            <div className="text-muted small mt-1 d-flex align-items-center gap-1">
              {subtitle}
            </div>
          )}
        </div>
        <div
          className="stat-card-icon"
          style={{
            backgroundColor: scheme.bg,
            color: scheme.text,
            border: `1px solid ${scheme.border}`,
          }}
        >
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
      {badgeText && (
        <div className="mt-3 pt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
          <span className={`badge bg-${badgeType} bg-opacity-25 text-${badgeType} font-mono small`}>
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
}
