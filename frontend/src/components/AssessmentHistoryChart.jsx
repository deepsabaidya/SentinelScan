import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AssessmentHistoryChart({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center">
        <i className="bi bi-graph-up text-muted fs-1 mb-2"></i>
        <div className="text-light fw-bold">No Historical Audit Trends</div>
        <div className="text-muted small">Run assessments on your registered websites to track score evolution.</div>
      </div>
    );
  }

  // Format labels & score points
  const labels = history.map((item) => {
    const d = new Date(item.date);
    return `${d.getMonth() + 1}/${d.getDate()} (${item.domain ? item.domain.split('.')[0] : ''})`;
  });

  const scores = history.map((item) => item.score);

  const data = {
    labels,
    datasets: [
      {
        label: 'Security Score',
        data: scores,
        borderColor: '#00e5ff',
        backgroundColor: 'rgba(0, 229, 255, 0.08)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#00e5ff',
        pointBorderColor: '#0a0f1d',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: 'rgba(0, 229, 255, 0.4)',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        padding: 10,
        callbacks: {
          label: (ctx) => `Score: ${ctx.parsed.y} / 100`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(56, 189, 248, 0.06)',
        },
        ticks: {
          color: '#64748b',
          font: { family: 'Inter', size: 10 },
          maxRotation: 45,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(56, 189, 248, 0.06)',
        },
        ticks: {
          color: '#64748b',
          font: { family: 'Inter', size: 10 },
          stepSize: 20,
        },
      },
    },
  };

  return (
    <div style={{ height: '240px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
}
