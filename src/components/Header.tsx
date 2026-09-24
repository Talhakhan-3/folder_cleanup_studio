import React, { useState } from 'react';
import { Sparkles, ShieldCheck, AlertTriangle, UserCheck, KeyRound, LogOut } from 'lucide-react';
import { AdminSettingsModal } from './AdminSettingsModal';

interface HeaderProps {
  realMode: boolean;
  onToggleRealMode?: () => void;
  username: string;
  onLogout?: () => void;
  onUsernameChanged?: (name: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  realMode,
  onToggleRealMode,
  username,
  onLogout,
  onUsernameChanged,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="pt-6 pb-6 text-center relative z-10 px-4">
        {/* Top Bar with Admin user info and Badge */}
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-gradient-to-r from-[#ff6b6b]/15 to-[#a78bfa]/15 text-[11px] font-semibold tracking-widest uppercase shadow-lg shadow-black/40">
            <span className="w-2 h-2 rounded-full bg-[#ff6b6b] shadow-[0_0_10px_#ff6b6b] anim-dot-glow" />
            <span>Folder Cleanup Tool</span>
            <Sparkles className="w-3.5 h-3.5 text-[#ffd93d]" />
          </div>

          {/* Admin User Control Bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#6bcb77]" />
              <span className="font-mono">{username}</span>
              <KeyRound className="w-3 h-3 text-[#ffd93d] ml-1" />
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/5 hover:bg-[#ff6b6b]/20 hover:text-[#ff6b6b] text-white/70 transition-all cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Serif Title with Wavy Underline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white mb-4">
          Clean your folder.{' '}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-white via-[#f0eeea] to-[#a8a29e] bg-clip-text text-transparent">
              Effortlessly.
            </span>
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 overflow-visible pointer-events-none"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
            >
              <path
                d="M2,6 Q15,2 25,6 T50,6 T75,6 T98,6"
                stroke="#ff6b6b"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="anim-draw-line"
              />
            </svg>
          </span>
        </h1>

        <p className="text-[#a8a29e] max-w-xl mx-auto text-base md:text-lg leading-relaxed mb-6 font-sans">
          Scan, deduplicate, rename, organize, and archive files — safely, with a full preview and instant undo.
        </p>

        {/* Status Mode Pill */}
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={onToggleRealMode}
            type="button"
            title="Toggle execution mode"
            className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              realMode
                ? 'border-[#ff6b6b]/40 text-[#ff6b6b] bg-[#ff6b6b]/10 hover:bg-[#ff6b6b]/20 shadow-[0_0_15px_rgba(255,107,107,0.2)]'
                : 'border-[#6bcb77]/40 text-[#6bcb77] bg-[#6bcb77]/10 hover:bg-[#6bcb77]/20 shadow-[0_0_15px_rgba(107,203,119,0.2)]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full relative ${
                realMode ? 'bg-[#ff6b6b] anim-ripple' : 'bg-[#6bcb77] anim-ripple'
              }`}
            />
            {realMode ? (
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Real Mode (Moves files)
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Dry-run Mode (Safe preview)
              </span>
            )}
          </button>
        </div>
      </header>

      <AdminSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        username={username}
        onUsernameChanged={onUsernameChanged}
      />
    </>
  );
};
