function ThroughputCard({ stats, humanitarianMode }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-foreground">
        Throughput Stats
      </h2>

      <div className="space-y-4">
        {/* Processed Count */}
        <div>
          <div className="text-xs text-muted-foreground mb-1">Scans Processed</div>
          <div className="text-3xl font-bold text-primary">{stats.processed}</div>
        </div>

        {/* Avg Processing Time */}
        <div>
          <div className="text-xs text-muted-foreground mb-1">Avg Processing Time</div>
          <div className="text-2xl font-semibold text-foreground">
            {stats.avgTimeMs > 0 ? `${(stats.avgTimeMs / 1000).toFixed(2)}s` : '--'}
          </div>
        </div>

        {/* Time Saved Estimate */}
        <div className="pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-1">
            Est. Time Saved{' '}
            {humanitarianMode && (
              <span className="text-primary font-semibold">(Humanitarian)</span>
            )}
          </div>
          <div className="text-2xl font-semibold text-accent">
            {formatTime(stats.timeSavedEstimate)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            vs. manual triage by radiologist
          </p>
        </div>

        {/* Model Speed Indicator */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Model Speed</span>
            <span className="text-xs text-primary font-bold">
              {humanitarianMode ? '⚡ Fast' : '⚙️ Normal'}
            </span>
          </div>
          
          {/* Simple "sparkline" using CSS */}
          <div className="flex items-end gap-0.5 h-8">
            {[...Array(20)].map((_, i) => {
              const height = humanitarianMode 
                ? Math.random() * 0.4 + 0.6 // High activity
                : Math.random() * 0.5 + 0.3; // Moderate activity
              return (
                <div
                  key={i}
                  className="flex-1 bg-primary rounded-t"
                  style={{ height: `${height * 100}%` }}
                ></div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 text-[10px] text-muted-foreground">
        💡 Humanitarian mode optimizes for rapid crisis response with faster processing
      </div>
    </div>
  );
}

export default ThroughputCard;
