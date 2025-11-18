import { useState, useEffect, useRef } from "react";
import Uploader from "./components/Uploader";
import Viewer from "./components/Viewer";
import QueuePanel from "./components/QueuePanel";
import ThroughputCard from "./components/ThroughputCard";
import { saveQueue, loadQueue } from "./utils/indexeddb";

interface Scan {
  id: string;
  fileName: string;
  imageData: string | null;
  status: "queued" | "processing" | "done";
  triageLevel: string | null;
  confidence: number | null;
  heatmapData: any[] | null;
  uploadedAt: string;
}

interface Stats {
  processed: number;
  avgTimeMs: number;
  timeSavedEstimate: number;
}

function App() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [humanitarianMode, setHumanitarianMode] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [stats, setStats] = useState<Stats>({
    processed: 0,
    avgTimeMs: 0,
    timeSavedEstimate: 0,
  });
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker
  useEffect(() => {
    // Create worker using Vite's worker URL handling
    workerRef.current = new Worker(
      new URL("./workers/inference.worker.js", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e) => {
      const { scanId, result, processingTime } = e.data;

      setScans((prev) =>
        prev.map((scan) =>
          scan.id === scanId
            ? {
                ...scan,
                status: "done",
                triageLevel: result.triageLevel,
                confidence: result.confidence,
                heatmapData: result.heatmapData,
              }
            : scan
        )
      );

      // Update stats
      setStats((prev) => {
        const newProcessed = prev.processed + 1;
        const newAvg =
          (prev.avgTimeMs * prev.processed + processingTime) / newProcessed;
        const timeSaved = humanitarianMode
          ? newProcessed * 45 // Estimate 45 seconds saved per scan in humanitarian mode
          : newProcessed * 30; // 30 seconds saved in normal mode

        return {
          processed: newProcessed,
          avgTimeMs: newAvg,
          timeSavedEstimate: timeSaved,
        };
      });
    };

    // Load persisted queue from IndexedDB
    loadQueue().then((savedScans) => {
      if (savedScans && savedScans.length > 0) {
        setScans(savedScans);
        // Re-process any that were still processing
        savedScans.forEach((scan) => {
          if (scan.status === "processing") {
            workerRef.current.postMessage({
              scanId: scan.id,
              imageData: scan.imageData,
              humanitarianMode,
            });
          }
        });
      }
    });

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Update worker's humanitarian mode
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "setHumanitarianMode",
        enabled: humanitarianMode,
      });
    }
  }, [humanitarianMode]);

  // Persist queue to IndexedDB whenever it changes
  useEffect(() => {
    if (scans.length > 0) {
      saveQueue(scans);
    }
  }, [scans]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle file upload
  const handleFilesAdded = (files: File[]) => {
    const newScans = files.map((file) => {
      const reader = new FileReader();
      const scanId = `scan-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      reader.onload = (e) => {
        const imageData = e.target?.result as string;

        setScans((prev) =>
          prev.map((scan) =>
            scan.id === scanId
              ? { ...scan, imageData, status: "processing" as const }
              : scan
          )
        );

        // Send to worker for processing
        if (workerRef.current) {
          workerRef.current.postMessage({
            scanId,
            imageData,
            humanitarianMode,
          });
        }
      };

      reader.readAsDataURL(file);

      return {
        id: scanId,
        fileName: file.name,
        imageData: null,
        status: "queued" as const,
        triageLevel: null,
        confidence: null,
        heatmapData: null,
        uploadedAt: new Date().toISOString(),
      };
    });

    setScans((prev) => [...prev, ...newScans]);

    // Auto-select first scan if none selected
    if (!selectedScanId && newScans.length > 0) {
      setSelectedScanId(newScans[0].id);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // U: open uploader (focus file input)
      if (e.key === "u" || e.key === "U") {
        const fileInput = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        fileInput?.click();
      }
      // H: toggle humanitarian mode
      if (e.key === "h" || e.key === "H") {
        setHumanitarianMode((prev) => !prev);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, []);

  const selectedScan = scans.find((s) => s.id === selectedScanId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-6 shadow-sm">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between flex-wrap gap-6">
          {/* Left Section — Title + Subtitle */}
          <div className="space-y-1">
            {/* Tag */}
            <span className="text-sm font-semibold text-orange-600 tracking-wide">
              Humanitarian Radiology AI
            </span>

            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              Offline Multi-Modal Radiology Triage
            </h1>

            <p className="text-sm text-gray-600">
              AI-powered medical imaging prioritization for humanitarian
              response
            </p>
          </div>

          {/* Right Section — Toggles */}
          <div className="flex items-center gap-4">
            {/* Humanitarian Mode Toggle */}
            <label className="flex items-center gap-3 cursor-pointer bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-200 transition">
              <input
                type="checkbox"
                checked={humanitarianMode}
                onChange={(e) => setHumanitarianMode(e.target.checked)}
                className="w-5 h-5 accent-orange-600 cursor-pointer"
                aria-label="Toggle humanitarian mode"
              />
              <div>
                <div className="font-semibold text-sm text-gray-900">
                  Humanitarian Mode
                </div>
                <div className="text-xs text-gray-500">
                  Optimized for crisis response
                </div>
              </div>
            </label>

            {/* Offline Indicator */}
            {isOffline && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 border border-red-300">
                <span className="w-2 h-2 bg-red-700 rounded-full animate-pulse"></span>
                Offline Mode
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-screen-2xl mx-auto w-full gap-6 p-6">
        {/* Left: Uploader + Throughput */}
        <div className="lg:w-80 flex flex-col gap-6">
          <Uploader onFilesAdded={handleFilesAdded} />
          <ThroughputCard stats={stats} humanitarianMode={humanitarianMode} />

          {/* Help Panel */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2 text-foreground">
              Keyboard Shortcuts
            </h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                <kbd className="bg-muted px-1.5 py-0.5 rounded">U</kbd> Open
                uploader
              </div>
              <div>
                <kbd className="bg-muted px-1.5 py-0.5 rounded">H</kbd> Toggle
                humanitarian mode
              </div>
            </div>
          </div>
        </div>

        {/* Center: Viewer */}
        <div className="flex-1 min-h-[500px]">
          <Viewer scan={selectedScan} />
        </div>

        {/* Right: Queue Panel */}
        <div className="lg:w-80">
          <QueuePanel
            scans={scans}
            selectedScanId={selectedScanId}
            onSelectScan={setSelectedScanId}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
        Datathon MVP Demo • Offline-capable • For demonstration purposes only
      </footer>
    </div>
  );
}

export default App;
