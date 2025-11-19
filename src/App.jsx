import { useState, useEffect, useRef } from "react";
import HeroSection from "./components/HeroSection";
import Uploader from "./components/Uploader";
import Viewer from "./components/Viewer";
import QueuePanel from "./components/QueuePanel";
import ThroughputCard from "./components/ThroughputCard";
import { saveQueue, loadQueue } from "./utils/indexeddb";
import { X } from "lucide-react";
import { registerUser, loginUser } from "./api/auth";
import "./App.css";

function App() {
  const [authMode, setAuthMode] = useState("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [humanitarianMode, setHumanitarianMode] = useState(false);
  const humanitarianRef = useRef(humanitarianMode);

  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  const workerRef = useRef(null);

  const [stats, setStats] = useState({
    processed: 0,
    avgTimeMs: 0,
    timeSavedEstimate: 0,
  });

  // Modal mount/active state for smooth transitions (duration-300)
  const [modalMounted, setModalMounted] = useState(false);
  const [modalActive, setModalActive] = useState(false);

  const openAuthModal = () => {
    setModalMounted(true);
    requestAnimationFrame(() => setModalActive(true));
  };

  const closeAuthModal = () => {
    setModalActive(false);
    setTimeout(() => setModalMounted(false), 300);
  };

  useEffect(() => {
    humanitarianRef.current = humanitarianMode;
  }, [humanitarianMode]);

  const checkStrength = (pwd) => {
    let score = 0;
    if (pwd.length > 6) score++;
    if (/\d/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    setPasswordStrength(score);
  };

  useEffect(() => {
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
                triageLevel: result?.triageLevel ?? scan.triageLevel,
                confidence: result?.confidence ?? scan.confidence,
                heatmapData: result?.heatmapData ?? scan.heatmapData,
              }
            : scan
        )
      );

      setStats((prev) => {
        const newProcessed = prev.processed + 1;
        const newAvg =
          (prev.avgTimeMs * prev.processed + processingTime) / newProcessed;
        const timeSaved = humanitarianRef.current
          ? newProcessed * 45
          : newProcessed * 30;

        return {
          processed: newProcessed,
          avgTimeMs: newAvg,
          timeSavedEstimate: timeSaved,
        };
      });
    };

    loadQueue().then((savedScans) => {
      if (savedScans && savedScans.length > 0) {
        setScans(savedScans);
        savedScans.forEach((scan) => {
          if (scan.status === "processing" && workerRef.current) {
            workerRef.current.postMessage({
              scanId: scan.id,
              imageData: scan.imageData,
              humanitarianMode: humanitarianRef.current,
            });
          }
        });
      }
    });

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "setHumanitarianMode",
        enabled: humanitarianMode,
      });
    }
  }, [humanitarianMode]);

  useEffect(() => {
    saveQueue(scans).catch(() => {});
  }, [scans]);

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

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { data } = await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      localStorage.setItem("triage_token", data.token);
      closeAuthModal();
      alert("Account created successfully!");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    }

    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("triage_token", data.token);
      closeAuthModal();
      alert("Logged in successfully!");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid credentials");
    }

    setLoading(false);
  };

  const handleFilesAdded = (files) => {
    const newScans = files.map((file) => {
      const reader = new FileReader();
      const scanId = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      reader.onload = (e) => {
        const imageData = e.target?.result ?? null;

        setScans((prev) =>
          prev.map((scan) =>
            scan.id === scanId ? { ...scan, imageData, status: "processing" } : scan
          )
        );

        if (workerRef.current) {
          workerRef.current.postMessage({
            scanId,
            imageData,
            humanitarianMode: humanitarianRef.current,
          });
        }
      };

      reader.readAsDataURL(file);

      return {
        id: scanId,
        fileName: file.name,
        imageData: null,
        status: "queued",
        triageLevel: null,
        confidence: null,
        heatmapData: null,
        uploadedAt: new Date().toISOString(),
      };
    });

    setScans((prev) => [...prev, ...newScans]);

    if (!selectedScanId && newScans.length > 0) setSelectedScanId(newScans[0].id);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = (e.key || "").toLowerCase();
      if (key === "u") document.querySelector('input[type="file"]')?.click();
      if (key === "h") setHumanitarianMode((prev) => !prev);
      if (key === "escape") closeAuthModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // close modal with Escape key (robust)
  useEffect(() => {
    if (!modalMounted) return;
    const onKey = (e) => e.key === "Escape" && closeAuthModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalMounted]);

  const selectedScan = scans.find((s) => s.id === selectedScanId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">TriageX</h1>
            <p className="text-sm text-muted-foreground">Diagnosing Disaster, Delivering Hope.</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={openAuthModal}
              className="px-5 py-2 rounded-md font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              Sign Up
            </button>

            <label className="flex items-center gap-3 cursor-pointer bg-secondary px-4 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors duration-200">
              <input
                type="checkbox"
                checked={humanitarianMode}
                onChange={(e) => setHumanitarianMode(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer"
                aria-label="Toggle humanitarian mode"
              />
              <div>
                <div className="font-semibold text-sm text-foreground">Humanitarian Mode</div>
                <div className="text-xs text-muted-foreground">Optimized for crisis response</div>
              </div>
            </label>

            {isOffline && (
              <div className="bg-urgent text-urgent-foreground px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-urgent-foreground rounded-full animate-pulse" />
                Offline Mode
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Smooth modal (duration-300) */}
      {modalMounted && (
        <div
          onClick={closeAuthModal}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
            modalActive ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300 bg-black/60 backdrop-blur-sm`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-8 relative transform transition-all duration-300 ${
              modalActive ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
            }`}
          >
            <button
              onClick={closeAuthModal}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative flex justify-center mb-6">
              {["signup", "login"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAuthMode(mode)}
                  className={`px-6 py-2 text-lg font-medium transition-colors ${
                    authMode === mode ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "signup" ? "Sign Up" : "Log In"}
                </button>
              ))}

              <div
                className={`absolute bottom-0 h-[2px] bg-primary rounded-full transition-all duration-300 ${
                  authMode === "signup" ? "left-[26%] w-[80px]" : "left-[56%] w-[70px]"
                }`}
              />
            </div>

            {authMode === "signup" ? (
              <>
                {error && <p className="text-red-500 text-sm mb-2 font-medium">{error}</p>}
                <form className="space-y-4" onSubmit={handleSignup}>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      onChange={handleChange}
                      value={formData.firstName}
                      placeholder="John"
                      className="w-full h-10 px-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary transition placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      onChange={handleChange}
                      value={formData.lastName}
                      placeholder="Doe"
                      className="w-full h-10 px-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary transition placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
                    <input
                      type="email"
                      name="email"
                      onChange={handleChange}
                      value={formData.email}
                      placeholder="you@example.com"
                      className="w-full h-10 px-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary transition placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        onChange={(e) => {
                          handleChange(e);
                          checkStrength(e.target.value);
                        }}
                        value={formData.password}
                        placeholder="Enter password"
                        className="w-full h-10 px-3 pr-10 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary transition placeholder:text-muted-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    <div className="mt-1 h-1 rounded bg-muted">
                      <div
                        className={`h-full rounded transition-all ${
                          passwordStrength === 1
                            ? "w-1/4 bg-red-500"
                            : passwordStrength === 2
                            ? "w-1/2 bg-orange-500"
                            : passwordStrength >= 3
                            ? "w-full bg-green-500"
                            : "w-0"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        onChange={handleChange}
                        value={formData.confirmPassword}
                        placeholder="Re-enter password"
                        className="w-full h-10 px-3 pr-10 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary transition placeholder:text-muted-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showConfirmPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Role</label>
                    <select
                      name="role"
                      onChange={handleChange}
                      value={formData.role}
                      className="w-full h-10 px-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary transition cursor-pointer"
                    >
                      <option value="">Select Role</option>
                      <option value="radiologist">Radiologist</option>
                      <option value="emergency">Emergency Physician</option>
                      <option value="trauma">Trauma Surgeon</option>
                      <option value="medical">Medical Officer</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full h-10 bg-primary text-primary-foreground rounded-lg font-semibold ${
                      loading ? "opacity-60 cursor-not-allowed" : "hover:bg-primary/90"
                    } shadow-md transition active:scale-[0.98]`}
                  >
                    {loading ? "Please wait..." : "Create Account"}
                  </button>
                </form>
              </>
            ) : (
              <>
                {error && <p className="text-red-500 text-sm mb-2 font-medium">{error}</p>}
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
                    <input
                      type="email"
                      name="email"
                      onChange={handleChange}
                      value={formData.email}
                      placeholder="you@example.com"
                      className="w-full h-10 px-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary transition placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        onChange={handleChange}
                        value={formData.password}
                        placeholder="Enter password"
                        className="w-full h-10 px-3 pr-10 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary transition placeholder:text-muted-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full h-10 bg-primary text-primary-foreground rounded-lg font-semibold ${
                      loading ? "opacity-60 cursor-not-allowed" : "hover:bg-primary/90"
                    } shadow-md transition active:scale-[0.98]`}
                  >
                    {loading ? "Please wait..." : "Log In"}
                  </button>

                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => setAuthMode("signup")} className="text-primary font-semibold hover:underline">
                      Sign Up
                    </button>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <HeroSection />

      <main className="flex-1 flex flex-col lg:flex-row max-w-screen-2xl mx-auto w-full gap-6 p-6">
        <div className="lg:w-80 flex flex-col gap-6">
          <Uploader onFilesAdded={handleFilesAdded} />
          <ThroughputCard stats={stats} humanitarianMode={humanitarianMode} />
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2 text-foreground">Keyboard Shortcuts</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                <kbd className="bg-muted px-1.5 py-0.5 rounded">U</kbd> Open uploader
              </div>
              <div>
                <kbd className="bg-muted px-1.5 py-0.5 rounded">H</kbd> Toggle humanitarian mode
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[500px]">
          <Viewer scan={selectedScan} />
        </div>

        <div className="lg:w-80">
          <QueuePanel scans={scans} selectedScanId={selectedScanId} onSelectScan={setSelectedScanId} />
        </div>
      </main>

      <footer className="bg-card border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
        Brought to you by Team InCISive Squad
      </footer>
    </div>
  );
}

export default App;
