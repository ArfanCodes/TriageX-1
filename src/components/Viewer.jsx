import { useState } from 'react';

function Viewer({ scan }) {
  const [showHeatmap, setShowHeatmap] = useState(true);

  if (!scan) {
    return (
      <div className="bg-card border border-border rounded-lg h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
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
          <p className="text-sm font-medium">No scan selected</p>
          <p className="text-xs mt-1">Upload images or select from the queue</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="bg-card border border-border rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{scan.fileName}</h2>
          <p className="text-xs text-muted-foreground">
            Uploaded: {new Date(scan.uploadedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Triage Badge */}
          {scan.triageLevel && (
            <div className={`px-4 py-2 rounded-lg font-bold text-sm ${getTriageBadgeColor(scan.triageLevel)}`}>
              {scan.triageLevel}
              {scan.confidence && (
                <span className="ml-2 opacity-90 font-normal">
                  {Math.round(scan.confidence * 100)}%
                </span>
              )}
            </div>
          )}

          {/* Status Badge */}
          {scan.status === 'processing' && (
            <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></div>
              Processing...
            </div>
          )}

          {/* Heatmap Toggle */}
          {scan.status === 'done' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
                aria-label="Toggle heatmap overlay"
              />
              <span className="text-sm font-medium text-foreground">Show Heatmap</span>
            </label>
          )}
        </div>
      </div>

      {/* Image Viewer */}
      <div className="flex-1 p-4 flex items-center justify-center bg-muted/30 relative overflow-hidden">
        {scan.imageData ? (
          <div className="relative max-w-full max-h-full">
            <img
              src={scan.imageData}
              alt={scan.fileName}
              className="max-w-full max-h-[calc(100vh-300px)] object-contain rounded-lg shadow-lg"
            />

            {/* Faux Heatmap Overlay */}
            {showHeatmap && scan.heatmapData && scan.status === 'done' && (
              <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
                {scan.heatmapData.map((spot, idx) => (
                  <div
                    key={idx}
                    className="absolute"
                    style={{
                      left: `${spot.x}%`,
                      top: `${spot.y}%`,
                      width: `${spot.radius}%`,
                      height: `${spot.radius}%`,
                      background: `radial-gradient(circle, ${spot.color}88 0%, ${spot.color}44 40%, transparent 70%)`,
                      transform: 'translate(-50%, -50%)',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">Loading image...</div>
        )}
      </div>

      {/* Footer Info */}
      {scan.status === 'done' && (
        <div className="border-t border-border p-4 bg-secondary/50">
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">
              <strong className="text-foreground">AI Analysis Complete:</strong> This scan has been
              automatically prioritized based on detected patterns.
            </p>
            <p className="text-[10px] opacity-75">
              ⚠️ For demonstration purposes only. Not for clinical use.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Viewer;
