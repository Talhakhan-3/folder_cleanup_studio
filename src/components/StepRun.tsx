import React, { useState } from 'react';
import { ArrowLeft, Play, ShieldAlert, Sparkles, Sliders, ChevronDown, ChevronUp, FolderArchive, Layers, CheckCircle2 } from 'lucide-react';
import { Config } from '../types';

interface StepRunProps {
  folderPath: string;
  recursive: boolean;
  config: Config;
  setConfig: (updater: (prev: Config) => Config) => void;
  realMode: boolean;
  setRealMode: (val: boolean) => void;
  onBack: () => void;
  onExecute: () => Promise<void>;
  isRunning: boolean;
  progressStep: { stepIndex: number; name: string } | null;
}

export const StepRun: React.FC<StepRunProps> = ({
  folderPath,
  recursive,
  config,
  setConfig,
  realMode,
  setRealMode,
  onBack,
  onExecute,
  isRunning,
  progressStep,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRealConfirm, setShowRealConfirm] = useState(false);

  // Rename preview computation
  const pattern = config.rename_pattern || '{name}_{date}{ext}';
  const previewExample = pattern
    .replaceAll('{name}', 'annual_report')
    .replaceAll('{date}', new Date().toISOString().slice(0, 10))
    .replaceAll('{ext}', '.pdf');

  const handleStartRun = () => {
    if (realMode) {
      setShowRealConfirm(true);
    } else {
      onExecute();
    }
  };

  const handleConfirmRealRun = () => {
    setShowRealConfirm(false);
    onExecute();
  };

  const pipelineStages = [
    { name: 'Scanning', desc: 'Read file metadata' },
    { name: 'Deduplicating', desc: 'Identify & move duplicate copies' },
    { name: 'Renaming', desc: 'Apply naming convention' },
    { name: 'Organizing', desc: 'Sort files into category folders' },
    { name: 'Archiving', desc: `Archive files older than ${config.archive_age_days} days` },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      {/* Real Run Confirmation Modal */}
      {showRealConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#ff6b6b]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#ff6b6b]">
              <div className="w-10 h-10 rounded-xl bg-[#ff6b6b]/15 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white">Confirm Real Run</h3>
                <span className="text-xs text-[#ff6b6b]">Files will actually be moved</span>
              </div>
            </div>

            <p className="text-xs text-[#a8a29e] leading-relaxed">
              This will execute all moves and renames on the actual filesystem for folder:
              <br />
              <code className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded mt-1 inline-block break-all">
                {folderPath}
              </code>
            </p>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/80 space-y-1">
              <div className="flex items-center gap-2 text-[#6bcb77]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>An undo log will be recorded. You can reverse this anytime.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRealConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRealRun}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#ff6b6b] hover:bg-[#ff5252] shadow-lg shadow-[#ff6b6b]/30 transition-all cursor-pointer"
              >
                Yes, Run Real Cleanup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Settings & Execution */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Column: Settings (3 cols) */}
        <div className="md:col-span-3 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#a78bfa]" />
              <span>Cleanup Configuration</span>
            </h3>

            {/* Mode Toggle */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Execution Mode</span>
                  <span className="text-[11px] text-[#a8a29e]">
                    {realMode ? 'Moves and renames files on disk' : 'Simulates all actions without touching files'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRealMode(!realMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    realMode ? 'bg-[#ff6b6b]' : 'bg-[#6bcb77]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                      realMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {realMode ? (
                <div className="text-[11px] text-[#ff6b6b] bg-[#ff6b6b]/10 p-2.5 rounded-lg border border-[#ff6b6b]/20 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Real Mode ON. Files will be rearranged. Undo log enabled.</span>
                </div>
              ) : (
                <div className="text-[11px] text-[#6bcb77] bg-[#6bcb77]/10 p-2.5 rounded-lg border border-[#6bcb77]/20 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Dry-run Mode. Completely safe preview of what would happen.</span>
                </div>
              )}
            </div>

            {/* Rename Pattern */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#a8a29e] uppercase tracking-wider">
                  Rename Pattern
                </label>
                <span className="text-[10px] text-white/40 font-mono">
                  Supported: {'{name}'}, {'{date}'}, {'{ext}'}
                </span>
              </div>
              <input
                type="text"
                value={config.rename_pattern}
                onChange={(e) => {
                  const val = e.target.value;
                  setConfig((prev) => ({ ...prev, rename_pattern: val }));
                }}
                placeholder="{name}_{date}{ext}"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#a78bfa]"
              />
              <div className="text-[11px] text-[#a8a29e] flex items-center gap-1.5 pt-0.5">
                <span>Live preview:</span>
                <code className="text-[#ffd93d] font-mono bg-black/40 px-2 py-0.5 rounded text-[11px]">
                  {previewExample}
                </code>
              </div>
            </div>

            {/* Archive Age Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#a8a29e] uppercase tracking-wider flex items-center gap-1.5">
                  <FolderArchive className="w-3.5 h-3.5 text-[#ff6b6b]" />
                  <span>Archive Threshold</span>
                </label>
                <span className="text-xs font-bold text-white font-mono">
                  {config.archive_age_days} days
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="730"
                step="30"
                value={config.archive_age_days}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setConfig((prev) => ({ ...prev, archive_age_days: val }));
                }}
                className="w-full accent-[#ff6b6b] cursor-pointer"
              />
              <p className="text-[11px] text-[#a8a29e]">
                Files modified more than <strong className="text-white">{config.archive_age_days} days</strong> ago will be moved to{' '}
                <code className="text-white/80 font-mono">Archive/&lt;year&gt;/</code>.
              </p>
            </div>

            {/* Advanced Categories Expander */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-xs font-semibold text-[#a8a29e] hover:text-white transition-colors cursor-pointer py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Category Extension Mappings</span>
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {Object.entries(config.categories).map(([cat, exts]) => (
                    <div key={cat} className="flex items-center gap-2 text-xs">
                      <span className="w-24 text-white/80 shrink-0 font-medium">{cat}</span>
                      <input
                        type="text"
                        value={exts.join(', ')}
                        onChange={(e) => {
                          const parsed = e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setConfig((prev) => ({
                            ...prev,
                            categories: {
                              ...prev.categories,
                              [cat]: parsed,
                            },
                          }));
                        }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] font-mono text-white/90"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Execution & Summary (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ffd93d]" />
              <span>Target & Pipeline</span>
            </h3>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1.5">
              <div className="text-[#a8a29e] text-[10px] uppercase tracking-wider font-semibold">Target Folder</div>
              <div className="font-mono text-white/90 break-all">{folderPath}</div>
              <div className="text-[11px] text-[#a8a29e] pt-1">
                Subfolders: <strong className="text-white">{recursive ? 'Yes (recursive)' : 'No (top-level only)'}</strong>
              </div>
            </div>

            {/* Pipeline Stage Indicators */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] text-[#a8a29e] uppercase tracking-wider font-semibold block">
                Execution Order
              </span>
              {pipelineStages.map((stage, i) => {
                const isCurrent = progressStep && progressStep.stepIndex === i;
                const isDone = progressStep && progressStep.stepIndex > i;

                return (
                  <div
                    key={stage.name}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition-all ${
                      isCurrent
                        ? 'bg-[#ff6b6b]/15 border border-[#ff6b6b]/30 text-white shadow-[0_0_12px_rgba(255,107,107,0.2)]'
                        : isDone
                        ? 'bg-[#6bcb77]/10 border border-[#6bcb77]/20 text-[#6bcb77]'
                        : 'bg-white/[0.02] border border-white/5 text-[#a8a29e]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-[#ff6b6b] text-white'
                          : isDone
                          ? 'bg-[#6bcb77] text-black'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {isDone ? '✓' : i + 1}
                    </span>
                    <div className="truncate">
                      <span className="font-medium text-white">{stage.name}</span>
                      <span className="text-[10px] text-white/40 ml-1.5 hidden sm:inline">({stage.desc})</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Progress Bar with Shimmer */}
            {isRunning && progressStep && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#ffd93d] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ffd93d] animate-ping" />
                    <span>Running: {progressStep.name}...</span>
                  </span>
                  <span className="text-white/60 font-mono">
                    {Math.round(((progressStep.stepIndex + 1) / 5) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                  <div
                    className="h-full rounded-full anim-shimmer transition-all duration-300"
                    style={{ width: `${((progressStep.stepIndex + 1) / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Run Button */}
            <div className="pt-3">
              <button
                type="button"
                disabled={isRunning}
                onClick={handleStartRun}
                className={`w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-white shadow-xl transition-all cursor-pointer ${
                  realMode
                    ? 'bg-gradient-to-r from-[#ff6b6b] to-[#e64c4c] hover:brightness-110 shadow-[#ff6b6b]/30'
                    : 'bg-gradient-to-r from-[#6bcb77] to-[#4d96ff] hover:brightness-110 shadow-[#6bcb77]/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isRunning ? 'Running Pipeline...' : realMode ? 'Execute Real Cleanup' : 'Run Dry-Run Preview'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          disabled={isRunning}
          onClick={onBack}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer disabled:opacity-40"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Scan</span>
        </button>
      </div>
    </div>
  );
};
