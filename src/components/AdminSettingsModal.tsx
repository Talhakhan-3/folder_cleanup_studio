import React, { useState } from 'react';
import { KeyRound, Shield, Check, AlertCircle, X } from 'lucide-react';
import { changeAdminPassword } from '../lib/api';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onUsernameChanged?: (newUsername: string) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  username,
  onUsernameChanged,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUsernameInput, setNewUsernameInput] = useState(username);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Username: ${username}\nDefault Password: CleanupAdmin2026!`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await changeAdminPassword(currentPassword, newPassword, newUsernameInput);
      if (res.success) {
        setSuccess('Admin credentials updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        if (onUsernameChanged && res.username) {
          onUsernameChanged(res.username);
        }
      } else {
        setError(res.error || 'Failed to update admin credentials');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#151515] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffd93d]/15 border border-[#ffd93d]/30 flex items-center justify-center text-[#ffd93d]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-white">Admin Account & Credentials</h3>
            <p className="text-xs text-[#a8a29e]">Manage your admin access credentials</p>
          </div>
        </div>

        {/* Current Info Card */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#ffd93d] font-semibold text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Current Admin Access</span>
            </span>
            <button
              onClick={handleCopy}
              className="text-white/60 hover:text-white cursor-pointer underline text-[10px] normal-case"
            >
              {copied ? <Check className="w-3 h-3 text-[#6bcb77] inline mr-1" /> : null}
              {copied ? 'Copied' : 'Copy Credentials'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-black/40 p-2.5 rounded-lg border border-white/5">
            <div>
              <span className="text-white/40 block text-[9px] uppercase font-sans">Username</span>
              <span className="text-white font-semibold">{username}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[9px] uppercase font-sans">Default Password</span>
              <span className="text-[#a78bfa] font-semibold">CleanupAdmin2026!</span>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handleSave} className="space-y-3.5 border-t border-white/10 pt-4">
          <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider">
            Change Credentials
          </h4>

          {error && (
            <div className="p-2.5 rounded-lg bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 text-xs text-[#ff6b6b] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-lg bg-[#6bcb77]/10 border border-[#6bcb77]/30 text-xs text-[#6bcb77] flex items-center gap-2">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#a8a29e] mb-1">
              Admin Username
            </label>
            <input
              type="text"
              value={newUsernameInput}
              onChange={(e) => setNewUsernameInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#a8a29e] mb-1">
              Current Password <span className="text-[#ff6b6b]">*</span>
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#a8a29e] mb-1">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading || !currentPassword}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#ff6b6b] to-[#a78bfa] hover:brightness-110 shadow-lg shadow-[#ff6b6b]/20 transition-all cursor-pointer disabled:opacity-40"
            >
              {isLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
