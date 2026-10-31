import React, { useState } from 'react';
import { api } from '../services/api';

export default function ReportDownloadButton({ assessmentId, domain, type = 'pdf' }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      if (type === 'pdf') {
        const filename = `SentinelScan-${domain || 'Report'}-${assessmentId}.pdf`;
        await api.downloadPDF(assessmentId, filename);
      } else {
        const filename = `SentinelScan-Findings-${domain || 'Export'}-${assessmentId}.csv`;
        await api.downloadCSV(assessmentId, filename);
      }
    } catch (err) {
      setError(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const isPDF = type === 'pdf';

  return (
    <div>
      <button
        className={isPDF ? 'btn-cyber-primary' : 'btn-cyber-secondary'}
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span>Generating {isPDF ? 'PDF' : 'CSV'}...</span>
          </>
        ) : (
          <>
            <i className={`bi ${isPDF ? 'bi-file-earmark-pdf-fill' : 'bi-file-earmark-spreadsheet-fill'}`}></i>
            <span>{isPDF ? 'Download PDF Report' : 'Export CSV Findings'}</span>
          </>
        )}
      </button>
      {error && <div className="text-danger small mt-1 font-mono">{error}</div>}
    </div>
  );
}
