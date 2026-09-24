import React, { useState } from 'react';
import { Folder, FolderPlus, ArrowRight, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { validateFolder, generateTestFolder } from '../lib/api';

interface StepStartProps {
  folderPath: string;
  setFolderPath: (val: string) => void;
  recursive: boolean;
  setRecursive: (val: boolean) => void;
  onContinue: () => void;
}

export const StepStart: React.FC<StepStartProps> = ({
  folderPath,
  setFolderPath,
  recursive,
  setRecursive,
  onContinue,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; resolved?: string; error?: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const handleValidate = async (pathToCheck: string) => {
    if (!pathToCheck.trim()) {
      setValidationResult(null);
      return;
    }
    setIsValidating(true);
    try {
      const res = await validateFolder(pathToCheck.trim());
      setValidationResult({ valid: res.valid, resolved: res.resolved_path, error: res.error });
    } catch (e: any) {
      setValidationResult({ valid: false, error: e.message });
    } finally {
      setIsValidating(false);
    }
  };

  const handleLoadDemoFolder = async () => {
    setIsGenerating(true);
    setDemoNotice(null);
    try {
      const res = await generateTestFolder();
      setFolderPath(res.relative_path);
      setValidationResult({ valid: true, resolved: res.folder_path });
      setDemoNotice('Demo folder loaded! Contains duplicates, old files, mixed categories, and unusual names.');
    } catch (err: any) {
      setDemoNotice(`Failed to generate demo folder: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff6b6b]/15 border border-[#ff6b6b]/30 flex items-center justify-center text-[#ff6b6b]">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white">Choose a folder</h2>
              <p className="text-xs text-[#a8a29e]">Select or enter the folder path you want to clean up</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLoadDemoFolder}
            disabled={isGenerating}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#ffd93d]/30 bg-[#ffd93d]/10 text-[#ffd93d] hover:bg-[#ffd93d]/20 transition-all cursor-pointer"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Try Messy Demo Folder</span>
          </button>
        </div>

        {demoNotice && (
          <div className="mb-5 p-3 rounded-xl bg-[#ffd93d]/10 border border-[#ffd93d]/25 text-[#ffd93d] text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{demoNotice}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#a8a29e] mb-2">
              Folder path
            </label>
            <div className="relative">
              <input
                type="text"
                value={folderPath}
                onChange={(e) => {
                  setFolderPath(e.target.value);
                  handleValidate(e.target.value);
                }}
                placeholder="e.g. messy_test_folder or /path/to/downloads"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Validation Feedback */}
          {isValidating && (
            <div className="flex items-center gap-2 text-xs text-white/50">
              <RefreshCw className="w-3 h-3 animate-spin" /> Checking folder...
            </div>
          )}

          {!isValidating && validationResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                validationResult.valid
                  ? 'bg-[#6bcb77]/10 border border-[#6bcb77]/30 text-[#6bcb77]'
                  : 'bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 text-[#ff6b6b]'
              }`}
            >
              {validationResult.valid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Folder verified:</span>{' '}
                    <code className="bg-black/30 px-1 py-0.5 rounded font-mono break-all">
                      {validationResult.resolved}
                    </code>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Directory not found.</span> Check the path or click "Try Messy Demo Folder" to generate safe test files.
                  </div>
                </>
              )}
            </div>
          )}

          {/* Subfolder option */}
          <div className="pt-2 flex items-center gap-3">
            <label className="relative flex items-center gap-2.5 text-xs text-[#a8a29e] cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={recursive}
                onChange={(e) => setRecursive(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#ff6b6b] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>Include subfolders (recursive scan)</span>
            </label>
          </div>

          {/* Quick buttons on mobile */}
          <div className="sm:hidden pt-1">
            <button
              type="button"
              onClick={handleLoadDemoFolder}
              disabled={isGenerating}
              className="w-full inline-flex justify-center items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-[#ffd93d]/30 bg-[#ffd93d]/10 text-[#ffd93d] hover:bg-[#ffd93d]/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use Messy Demo Folder</span>
            </button>
          </div>

          {/* Continue button */}
          <div className="pt-4">
            <button
              type="button"
              disabled={!folderPath.trim() || (validationResult !== null && !validationResult.valid)}
              onClick={onContinue}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#ff6b6b] to-[#a78bfa] hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#ff6b6b]/25 transition-all cursor-pointer"
            >
              <span>Continue → Scan Folder</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
