import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StepTracker } from './components/StepTracker';
import { StepStart } from './components/StepStart';
import { StepScan } from './components/StepScan';
import { StepRun } from './components/StepRun';
import { StepResults } from './components/StepResults';
import { AuthModal } from './components/AuthModal';
import { Config, FileInfo, PipelineSummary } from './types';
import { fetchConfig, scanFolder, runPipeline, fetchAuthStatus, logout, getStoredUsername } from './lib/api';

export const App: React.FC = () => {
  const [authNeeded, setAuthNeeded] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string>(getStoredUsername());

  // Wizard state
  const [step, setStep] = useState<number>(1);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);

  // Workflow state
  const [folderPath, setFolderPath] = useState<string>('messy_test_folder');
  const [recursive, setRecursive] = useState<boolean>(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [realMode, setRealMode] = useState<boolean>(false);
  const [config, setConfig] = useState<Config>({
    dry_run: true,
    archive_age_days: 180,
    rename_pattern: '{name}_{date}{ext}',
    categories: {
      Images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
      Documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
      Spreadsheets: ['.xls', '.xlsx', '.csv'],
      Presentations: ['.ppt', '.pptx'],
      Audio: ['.mp3', '.wav', '.flac', '.aac'],
      Video: ['.mp4', '.mov', '.avi', '.mkv'],
      Archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
      Code: ['.py', '.js', '.ts', '.html', '.css', '.java', '.cpp', '.c', '.json'],
      Other: [],
    },
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<{ stepIndex: number; name: string } | null>(null);
  const [lastSummary, setLastSummary] = useState<PipelineSummary | null>(null);

  // Check auth and initial config
  useEffect(() => {
    fetchAuthStatus()
      .then((res) => {
        setAuthNeeded(res.auth_enabled);
        setIsAuthenticated(res.authenticated);
        if (res.username) {
          setAdminUsername(res.username);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });

    fetchConfig()
      .then((cfg) => {
        setConfig(cfg);
        setRealMode(!cfg.dry_run);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
  };

  const goToStep = (targetStep: number) => {
    setStep(targetStep);
    if (targetStep > maxStepReached) {
      setMaxStepReached(targetStep);
    }
  };

  const handleScan = async () => {
    if (!folderPath.trim()) return;
    setIsScanning(true);
    try {
      const res = await scanFolder(folderPath.trim(), recursive);
      setFiles(res.files);
      goToStep(2);
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleExecute = async () => {
    setIsRunning(true);
    const steps = ['Scanning folder', 'Checking duplicates', 'Renaming files', 'Organizing categories', 'Archiving old files'];

    // Simulated stepped progression for UI feedback
    for (let i = 0; i < steps.length - 1; i++) {
      setProgressStep({ stepIndex: i, name: steps[i] });
      await new Promise((r) => setTimeout(r, 320));
    }
    setProgressStep({ stepIndex: 4, name: steps[4] });

    try {
      const summary = await runPipeline(folderPath, !realMode, recursive, config);
      setLastSummary(summary);
      await new Promise((r) => setTimeout(r, 400));
      goToStep(4);
    } catch (err: any) {
      alert(`Pipeline execution error: ${err.message}`);
    } finally {
      setIsRunning(false);
      setProgressStep(null);
    }
  };

  const handleStartOver = () => {
    setStep(1);
    setMaxStepReached(1);
    setFiles([]);
    setLastSummary(null);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f7f5f2] relative overflow-x-hidden pb-16">
      {/* Background Animated Blobs */}
      <div
        className="fixed -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none anim-blob-1"
        style={{
          background: 'radial-gradient(circle, rgba(255, 107, 107, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />
      <div
        className="fixed -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none anim-blob-2"
        style={{
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />

      {/* Auth Modal Gate */}
      {authNeeded && !isAuthenticated && (
        <AuthModal
          onSuccess={() => {
            setIsAuthenticated(true);
            setAdminUsername(getStoredUsername());
          }}
        />
      )}

      {/* Main Content */}
      <div className="relative z-10">
        <Header
          realMode={realMode}
          onToggleRealMode={() => setRealMode(!realMode)}
          username={adminUsername}
          onLogout={handleLogout}
          onUsernameChanged={(name) => setAdminUsername(name)}
        />

        <StepTracker
          currentStep={step}
          onSelectStep={(s) => goToStep(s)}
          maxStepReached={maxStepReached}
        />

        <main className="mt-4">
          {step === 1 && (
            <StepStart
              folderPath={folderPath}
              setFolderPath={setFolderPath}
              recursive={recursive}
              setRecursive={setRecursive}
              onContinue={handleScan}
            />
          )}

          {step === 2 && (
            <StepScan
              folderPath={folderPath}
              recursive={recursive}
              files={files}
              onBack={() => setStep(1)}
              onContinue={() => goToStep(3)}
              onRescan={handleScan}
              isScanning={isScanning}
            />
          )}

          {step === 3 && (
            <StepRun
              folderPath={folderPath}
              recursive={recursive}
              config={config}
              setConfig={setConfig}
              realMode={realMode}
              setRealMode={setRealMode}
              onBack={() => setStep(2)}
              onExecute={handleExecute}
              isRunning={isRunning}
              progressStep={progressStep}
            />
          )}

          {step === 4 && (
            <StepResults
              summary={lastSummary}
              folderPath={folderPath}
              onBack={() => setStep(3)}
              onStartOver={handleStartOver}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
