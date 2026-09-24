import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle2, AlertTriangle, FolderTree as TreeIcon, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { PipelineSummary } from '../types';
import { WattenBarChart } from './WattenBarChart';
import { undoLastRun, getUndoStatus, exploreFolder } from '../lib/api';
import { FolderTree } from './FolderTree';

interface StepResultsProps {
  summary: PipelineSummary | null;
  folderPath: string;
  onBack: () => void;
  onStartOver: () => void;
}

export const StepResults: React.FC<StepResultsProps> = ({
  summary,
  folderPath,
  onBack,
  onStartOver,
}) => {
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
  const [hasUndoLog, setHasUndoLog] = useState(false);
  const [undoActionCount, setUndoActionCount] = useState(0);

  // Folder Explorer state
  const [showExplorer, setShowExplorer] = useState(false);
  const [treeData, setTreeData] = useState<any>(null);
  const [isLoadingTree, setIsLoadingTree] = useState(false);

  const checkUndo = async () => {
    try {
      const res = await getUndoStatus();
      setHasUndoLog(res.has_undo);
      setUndoActionCount(res.action_count);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkUndo();
  }, []);

  const handleUndo = async () => {
    setIsUndoing(true);
    setUndoMessage(null);
    try {
      const res = await undoLastRun();
      if (res.undone_count > 0) {
        setUndoMessage(`✅ Successfully reversed ${res.undone_count} actions! Files restored to previous locations.`);
      } else {
        setUndoMessage('ℹ️ Nothing to undo.');
      }
      await checkUndo();
      if (showExplorer) {
        loadTree();
      }
    } catch (err: any) {
      setUndoMessage(`❌ Undo failed: ${err.message}`);
    } finally {
      setIsUndoing(false);
    }
  };

  const loadTree = async () => {
    setIsLoadingTree(true);
    try {
      const res = await exploreFolder(folderPath);
      setTreeData(res.tree);
    } catch (err: any) {
      console.warn('Failed to load folder tree:', err);
    } finally {
      setIsLoadingTree(false);
    }
  };

  const toggleExplorer = () => {
    const next = !showExplorer;
    setShowExplorer(next);
    if (next && !treeData) {
      loadTree();
    }
  };

  if (!summary) {
    return (
      <div className="max-w-2xl mx-auto px-4 text-center py-12">
        <p className="text-[#a8a29e] text-sm">No results available. Please run the cleanup pipeline first.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white"
        >
          Return to Run
        </button>
      </div>
    );
  }

  const chartData = [
    { label: 'Renamed', value: summary.files_renamed },
    { label: 'Organized', value: summary.files_organized },
    { label: 'Archived', value: summary.files_archived },
    { label: 'Duplicates', value: summary.duplicates_found },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6bcb77]/10 border border-[#6bcb77]/30 text-xs font-semibold text-[#6bcb77] mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Cleanup Pipeline Complete</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
          {summary.dry_run ? 'Dry-Run Simulation Results' : 'Real Cleanup Applied Successfully'}
        </h2>
        <p className="text-xs text-[#a8a29e] max-w-md mx-auto">
          {summary.dry_run
            ? 'No files were modified. Review the projected operations below before running for real.'
            : 'All actions were applied and recorded to logs/undo_log.json for safe rollback.'}
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <span className="text-[10px] uppercase font-semibold text-[#a8a29e] tracking-wider block">
            Scanned
          </span>
          <span className="text-2xl font-serif font-bold text-white mt-1 block">
            {summary.files_scanned}
          </span>
        </div>

        <div className="glass-card rounded-xl p-4 text-center">
          <span className="text-[10px] uppercase font-semibold text-[#a8a29e] tracking-wider block">
            Duplicates
          </span>
          <span className="text-2xl font-serif font-bold text-[#ffd93d] mt-1 block">
            {summary.duplicates_found}
          </span>
        </div>

        <div className="glass-card rounded-xl p-4 text-center">
          <span className="text-[10px] uppercase font-semibold text-[#a8a29e] tracking-wider block">
            Renamed
          </span>
          <span className="text-2xl font-serif font-bold text-[#a78bfa] mt-1 block">
            {summary.files_renamed}
          </span>
        </div>

        <div className="glass-card rounded-xl p-4 text-center">
          <span className="text-[10px] uppercase font-semibold text-[#a8a29e] tracking-wider block">
            Organized
          </span>
          <span className="text-2xl font-serif font-bold text-[#4d96ff] mt-1 block">
            {summary.files_organized}
          </span>
        </div>

        <div className="glass-card rounded-xl p-4 text-center">
          <span className="text-[10px] uppercase font-semibold text-[#a8a29e] tracking-wider block">
            Archived
          </span>
          <span className="text-2xl font-serif font-bold text-[#ff6b6b] mt-1 block">
            {summary.files_archived}
          </span>
        </div>

        <div className="glass-card rounded-xl p-4 text-center">
          <span className="text-[10px] uppercase font-semibold text-[#a8a29e] tracking-wider block">
            Mode
          </span>
          <span
            className={`text-lg font-serif font-bold mt-1 block ${
              summary.dry_run ? 'text-[#6bcb77]' : 'text-[#ff6b6b]'
            }`}
          >
            {summary.dry_run ? 'Dry-run' : 'Real'}
          </span>
        </div>
      </div>

      {/* Breakdown Chart */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
            <span>📊 Actions Breakdown</span>
          </h3>
        </div>
        <WattenBarChart data={chartData} height={180} />
      </div>

      {/* Directory Explorer Accordion */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <TreeIcon className="w-4 h-4 text-[#ffd93d]" />
              <span>Explore Folder Structure</span>
            </h3>
            <p className="text-xs text-[#a8a29e]">
              Inspect subfolders like <code className="text-white/80 font-mono">Images/</code>, <code className="text-white/80 font-mono">Archive/</code>, or <code className="text-white/80 font-mono">review_duplicates/</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleExplorer}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer shrink-0"
          >
            {showExplorer ? 'Hide Structure' : 'Inspect Structure'}
          </button>
        </div>

        {showExplorer && (
          <div className="pt-2">
            {isLoadingTree ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-white/50">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reading directory tree...</span>
              </div>
            ) : treeData ? (
              <FolderTree tree={treeData} />
            ) : (
              <div className="text-xs text-white/40 italic py-4">Failed to load directory tree.</div>
            )}
          </div>
        )}
      </div>

      {/* Undo Section */}
      <div className="glass-card rounded-2xl p-6 border-white/15 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#ff6b6b]" />
              <span>Undo Last Real Run</span>
            </h3>
            <p className="text-xs text-[#a8a29e] mt-1">
              Reverses all moves and renames from the most recent real cleanup run in reverse chronological order.
            </p>
          </div>

          <button
            type="button"
            onClick={handleUndo}
            disabled={isUndoing || (!hasUndoLog && summary.dry_run)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#ff6b6b]/40 bg-[#ff6b6b]/15 hover:bg-[#ff6b6b]/25 text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isUndoing ? 'animate-spin' : ''}`} />
            <span>{isUndoing ? 'Reversing...' : 'Undo Last Run'}</span>
          </button>
        </div>

        {undoMessage && (
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white">
            {undoMessage}
          </div>
        )}

        {hasUndoLog && !undoMessage && (
          <div className="text-[11px] text-[#a8a29e] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6bcb77]" />
            <span>Undo log is active with {undoActionCount} recorded action(s).</span>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Configuration</span>
        </button>

        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#ff6b6b] to-[#a78bfa] hover:brightness-110 shadow-lg shadow-[#ff6b6b]/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Start New Cleanup</span>
        </button>
      </div>
    </div>
  );
};
