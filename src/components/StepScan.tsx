import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Search, Copy, Check, RefreshCw, Files, HardDrive, Layers, FolderTree as FolderTreeIcon } from 'lucide-react';
import { FileInfo, DuplicateGroup } from '../types';
import { formatBytes, checkDuplicates } from '../lib/api';
import { WattenBarChart } from './WattenBarChart';

interface StepScanProps {
  folderPath: string;
  recursive: boolean;
  files: FileInfo[];
  onBack: () => void;
  onContinue: () => void;
  onRescan: () => void;
  isScanning: boolean;
}

export const StepScan: React.FC<StepScanProps> = ({
  folderPath,
  recursive,
  files,
  onBack,
  onContinue,
  onRescan,
  isScanning,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCheckingDupes, setIsCheckingDupes] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<Record<string, string[]> | null>(null);

  // Calculate metrics
  const totalSizeBytes = useMemo(() => files.reduce((acc, f) => acc + f.size_bytes, 0), [files]);

  // Category counts for WattenBarChart
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of files) {
      counts[f.category] = (counts[f.category] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [files]);

  const categories = useMemo(() => {
    const set = new Set(files.map((f) => f.category));
    return ['All', ...Array.from(set)];
  }, [files]);

  // Filtered files for table
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [files, searchTerm, selectedCategory]);

  const handleCheckDuplicates = async () => {
    setIsCheckingDupes(true);
    try {
      const paths = files.map((f) => f.path);
      const res = await checkDuplicates(paths);
      setDuplicateGroups(res.duplicate_groups);
    } catch (err: any) {
      alert(`Error checking duplicates: ${err.message}`);
    } finally {
      setIsCheckingDupes(false);
    }
  };

  const dupeGroupCount = duplicateGroups ? Object.keys(duplicateGroups).length : 0;
  const dupeExtraFilesCount = duplicateGroups
    ? Object.values(duplicateGroups).reduce((acc, paths) => acc + (paths.length - 1), 0)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card rounded-2xl p-5">
        <div>
          <span className="text-xs font-semibold text-[#a8a29e] uppercase tracking-wider">
            Target Directory
          </span>
          <div className="text-sm font-mono text-white/90 break-all">{folderPath}</div>
        </div>
        <button
          type="button"
          onClick={onRescan}
          disabled={isScanning}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning...' : 'Re-scan Folder'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 text-[#a8a29e] text-xs font-semibold uppercase tracking-wider mb-2">
            <Files className="w-4 h-4 text-[#ff6b6b]" />
            <span>Files Found</span>
          </div>
          <div className="text-3xl font-serif font-bold text-white">{files.length}</div>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 text-[#a8a29e] text-xs font-semibold uppercase tracking-wider mb-2">
            <HardDrive className="w-4 h-4 text-[#a78bfa]" />
            <span>Total Size</span>
          </div>
          <div className="text-3xl font-serif font-bold text-white">{formatBytes(totalSizeBytes)}</div>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 text-[#a8a29e] text-xs font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4 text-[#ffd93d]" />
            <span>Categories</span>
          </div>
          <div className="text-3xl font-serif font-bold text-white">{categoryCounts.length}</div>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 text-[#a8a29e] text-xs font-semibold uppercase tracking-wider mb-2">
            <FolderTreeIcon className="w-4 h-4 text-[#6bcb77]" />
            <span>Subfolders</span>
          </div>
          <div className="text-3xl font-serif font-bold text-white">{recursive ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Category Chart Section */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <span>📊 Files by Category</span>
          </h3>
          <span className="text-xs text-[#a8a29e]">{categoryCounts.length} distinct categories</span>
        </div>
        <WattenBarChart data={categoryCounts} height={200} />
      </div>

      {/* Duplicate Checker Section */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Copy className="w-4 h-4 text-[#ffd93d]" />
              <span>Duplicate Content Check</span>
            </h3>
            <p className="text-xs text-[#a8a29e] mt-1">
              Computes SHA-256 hashes of all file contents to identify identical copies with different names.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCheckDuplicates}
            disabled={isCheckingDupes || files.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#ffd93d]/30 bg-[#ffd93d]/10 hover:bg-[#ffd93d]/20 text-[#ffd93d] transition-all cursor-pointer shrink-0"
          >
            {isCheckingDupes ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCheckingDupes ? 'Hashing files...' : 'Check for Duplicates'}</span>
          </button>
        </div>

        {duplicateGroups && (
          <div className="mt-4 pt-4 border-t border-white/10">
            {dupeGroupCount > 0 ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#ffd93d]/10 border border-[#ffd93d]/30 text-xs text-[#ffd93d]">
                  Found <strong className="text-white">{dupeGroupCount}</strong> duplicate groups with{' '}
                  <strong className="text-white">{dupeExtraFilesCount}</strong> redundant files that will safely move to{' '}
                  <code className="bg-black/40 px-1 py-0.5 rounded font-mono">review_duplicates/</code>.
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(duplicateGroups).map(([hash, paths], i) => (
                    <div key={hash} className="text-xs bg-white/[0.03] p-3 rounded-xl border border-white/5 space-y-1">
                      <div className="font-semibold text-white/90 flex items-center gap-2">
                        <span className="text-[#ffd93d]">Group #{i + 1}</span>
                        <span className="text-white/40 text-[10px] font-mono">({hash.slice(0, 12)}…)</span>
                      </div>
                      <div className="text-[11px] font-mono text-white/70 pl-2 border-l border-white/10 space-y-0.5">
                        <div className="text-[#6bcb77]">Keep: {paths[0]}</div>
                        {paths.slice(1).map((p) => (
                          <div key={p} className="text-[#ff6b6b]/90">Move to review: {p}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#6bcb77]/10 border border-[#6bcb77]/30 text-xs text-[#6bcb77] flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>No duplicate files found! All file contents are unique.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Preview Table */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-serif font-bold text-white">🗂️ File Preview</h3>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter files..."
                className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] w-36 sm:w-48"
              />
            </div>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-[#1c1c1c] text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.04] text-[#a8a29e] uppercase text-[10px] tracking-wider border-b border-white/10 sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Name</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Size</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Modified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredFiles.slice(0, 100).map((file, idx) => {
                  const modDate = new Date(file.modified_date).toLocaleDateString();
                  return (
                    <tr key={`${file.path}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-4 font-mono text-white/90 truncate max-w-xs">{file.name}</td>
                      <td className="py-2 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 border border-white/10 text-white/80">
                          {file.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-white/70">{formatBytes(file.size_bytes)}</td>
                      <td className="py-2 px-4 text-right text-white/50">{modDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredFiles.length > 100 && (
            <div className="py-2 px-4 bg-white/[0.02] text-[11px] text-white/40 text-center border-t border-white/5">
              Showing first 100 of {filteredFiles.length} matched files.
            </div>
          )}
          {filteredFiles.length === 0 && (
            <div className="py-8 text-center text-white/40 text-xs">
              No files matched the current filters.
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#ff6b6b] to-[#a78bfa] hover:brightness-110 shadow-lg shadow-[#ff6b6b]/20 transition-all cursor-pointer"
        >
          <span>Continue → Configure & Run</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
