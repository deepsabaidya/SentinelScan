import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SeverityChart({ distribution = {} }) {
  const dataValues = [
    distribution.Critical || 0,
    distribution.High || 0,
    distribution.Medium || 0,
    distribution.Low || 0,
    distribution.Informational || 0,
  ];

  const total = dataValues.reduce((a, b) => a + b, 0);

  const data = {
    labels: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
    datasets: [
      {
        data: dataValues,
        backgroundColor: [
          '#ef4444', // Critical Red
          '#f97316', // High Orange
          '#f59e0b', // Medium Amber
          '#38bdf8', // Low Sky Blue
          '#64748b', // Informational Slate
        ],
        borderColor: '#0a0f1d',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        padding: 10,
      },
    },
    cutout: '72%',
  };

  if (total === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 py-4 text-center">
        <i className="bi bi-shield-check text-success fs-1 mb-2"></i>
        <div className="text-light fw-bold">Zero Active Vulnerabilities</div>
        <div className="text-muted small">No findings reported across registered scans.</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '240px', width: '100%' }}>
      <Doughnut data={data} options={options} />
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div className="font-heading fw-bold fs-3 text-light lh-1">{total}</div>
        <div className="text-muted font-mono" style={{ fontSize: '0.65rem' }}>TOTAL ISSUES</div>
      </div>
    </div>
  );
}
