import { useState } from 'react';

function QueuePanel({ scans, selectedScanId, onSelectScan }) {
  const [exportMessage, setExportMessage] = useState('');

  const getStatusColor = (status) => {
    switch (status) {
      case 'done':
        return 'bg-primary text-primary-foreground';
      case 'processing':
        return 'bg-accent text-accent-foreground';
      case 'queued':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTriageBadgeColor = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-critical text-critical-foreground';
      case 'URGENT':
        return 'bg-urgent text-urgent-foreground';
      case 'STABLE':
        return 'bg-stable text-stable-foreground';
      case 'NON-URGENT':
        return 'bg-non-urgent text-non-urgent-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleExportReport = () => {
    const report = {
      exportDate: new Date().toISOString(),
      totalScans: scans.length,
      processed: scans.filter((s) => s.status === 'done').length,
      scans: scans.map((scan) => ({
        fileName: scan.fileName,
        uploadedAt: scan.uploadedAt,
        status: scan.status,
        triageLevel: scan.triageLevel,
        confidence: scan.confidence,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportMessage('✓ Report exported');
    setTimeout(() => setExportMessage(''), 3000);
  };

  return (
    <div className="bg-sidebar border border-sidebar-border rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-sidebar-border p-4">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          Patient Queue
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {scans.length} scan{scans.length !== 1 ? 's' : ''} •{' '}
          {scans.filter((s) => s.status === 'done').length} processed
        </p>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-2">
        {scans.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <p>No scans in queue</p>
            <p className="text-xs mt-1">Upload images to begin triage</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scans.map((scan) => (
              <button
                key={scan.id}
                onClick={() => onSelectScan(scan.id)}
                className={`
                  w-full p-3 rounded-lg border-2 text-left transition-all
                  hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary
                  ${
                    selectedScanId === scan.id
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-card hover:border-border'
                  }
                `}
                aria-label={`Select scan ${scan.fileName}`}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-muted rounded flex-shrink-0 overflow-hidden">
                    {scan.imageData ? (
                      <img
                        src={scan.imageData}
                        alt={scan.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {scan.fileName}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${getStatusColor(
                          scan.status
                        )}`}
                      >
                        {scan.status}
                      </span>
                      
                      {scan.triageLevel && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${getTriageBadgeColor(
                            scan.triageLevel
                          )}`}
                        >
                          {scan.triageLevel}
                        </span>
                      )}
                    </div>

                    {scan.confidence && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Confidence: {Math.round(scan.confidence * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Export */}
      {scans.length > 0 && (
        <div className="border-t border-sidebar-border p-4">
          <button
            onClick={handleExportReport}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            aria-label="Export triage report"
          >
            Export Triage Report
          </button>
          {exportMessage && (
            <p className="text-xs text-center mt-2 text-primary font-semibold">
              {exportMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default QueuePanel;
