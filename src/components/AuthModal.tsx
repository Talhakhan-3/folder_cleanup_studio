import React, { useState } from 'react';
import { Lock, AlertCircle, ArrowRight, KeyRound, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { login } from '../lib/api';

interface AuthModalProps {
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fillAdminCredentials = () => {
    setUsername('admin');
    setPassword('CleanupAdmin2026!');
    setError(null);
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText('Username: admin\nPassword: CleanupAdmin2026!');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await login(username.trim(), password.trim());
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Invalid username or password');
      }
    } catch {
      setError('Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#151515] border border-white/10 rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#ff6b6b]/15 border border-[#ff6b6b]/30 flex items-center justify-center text-[#ff6b6b] mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">Admin Authentication</h2>
          <p className="text-xs text-[#a8a29e]">Sign in to access and operate the Folder Cleanup Tool</p>
        </div>

        {/* Credentials Banner */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-2">
          <div className="flex items-center justify-between text-[#ffd93d] font-semibold text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Admin Credentials</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="text-[#6bcb77] hover:text-[#6bcb77]/80 cursor-pointer underline text-[10px] normal-case font-medium"
              >
                1-Click Auto-Fill
              </button>
              <button
                type="button"
                onClick={copyCredentials}
                className="text-white/50 hover:text-white cursor-pointer text-[10px] normal-case"
              >
                {copied ? <Check className="w-3 h-3 text-[#6bcb77]" /> : 'Copy'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-black/40 p-2.5 rounded-lg border border-white/5">
            <div>
              <span className="text-white/40 block text-[9px] uppercase font-sans">Username</span>
              <span className="text-white font-semibold">admin</span>
            </div>
            <div>
              <span className="text-white/40 block text-[9px] uppercase font-sans">Password</span>
              <span className="text-[#a78bfa] font-semibold">CleanupAdmin2026!</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 text-xs text-[#ff6b6b] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#a8a29e] mb-1.5">
              Admin Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#a8a29e] mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#ff6b6b] to-[#a78bfa] hover:brightness-110 shadow-lg shadow-[#ff6b6b]/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? 'Verifying...' : 'Sign In as Admin'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
