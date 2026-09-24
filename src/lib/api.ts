import { Config, FileInfo, PipelineSummary } from '../types';

const TOKEN_KEY = 'folder_cleanup_token';
const USERNAME_KEY = 'folder_cleanup_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUsername(): string {
  return localStorage.getItem(USERNAME_KEY) || 'admin';
}

export function setStoredAuth(token: string, username: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchAuthStatus(): Promise<{ auth_enabled: boolean; authenticated: boolean; username?: string }> {
  const res = await fetch('/api/auth/status', {
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (data.success && data.token) {
    setStoredAuth(data.token, data.username || username);
    return { success: true };
  }
  return { success: false, error: data.error || 'Invalid credentials' };
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { ...authHeaders() },
    });
  } finally {
    clearStoredAuth();
  }
}

export async function changeAdminPassword(currentPassword: string, newPassword: string, newUsername?: string): Promise<{ success: boolean; username?: string; error?: string }> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, new_username: newUsername }),
  });
  return res.json();
}

export async function fetchConfig(): Promise<Config> {
  const res = await fetch('/api/config', { headers: { ...authHeaders() } });
  return res.json();
}

export async function updateConfig(config: Config): Promise<void> {
  await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(config),
  });
}

export async function generateTestFolder(): Promise<{ success: boolean; folder_path: string; relative_path: string }> {
  const res = await fetch('/api/generate-test-folder', { method: 'POST', headers: { ...authHeaders() } });
  return res.json();
}

export async function validateFolder(folder: string): Promise<{ valid: boolean; resolved_path?: string; error?: string }> {
  const res = await fetch(`/api/validate-folder?folder=${encodeURIComponent(folder)}`, { headers: { ...authHeaders() } });
  return res.json();
}

export async function scanFolder(folder: string, recursive: boolean): Promise<{ files: FileInfo[]; count: number }> {
  const res = await fetch(`/api/scan?folder=${encodeURIComponent(folder)}&recursive=${recursive}`, { headers: { ...authHeaders() } });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to scan folder');
  }
  return res.json();
}

export async function checkDuplicates(filePaths: string[]): Promise<{ duplicate_groups: Record<string, string[]>; count: number }> {
  const res = await fetch('/api/duplicates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ file_paths: filePaths }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to check duplicates');
  }
  return res.json();
}

export async function runPipeline(
  folderPath: string,
  dryRun: boolean,
  recursive: boolean,
  config?: Config
): Promise<PipelineSummary> {
  const res = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      folder_path: folderPath,
      dry_run: dryRun,
      recursive,
      config,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to execute cleanup pipeline');
  }
  return res.json();
}

export async function getUndoStatus(): Promise<{ has_undo: boolean; action_count: number }> {
  const res = await fetch('/api/undo-status', { headers: { ...authHeaders() } });
  return res.json();
}

export async function undoLastRun(): Promise<{ success: boolean; undone_count: number; message?: string }> {
  const res = await fetch('/api/undo', { method: 'POST', headers: { ...authHeaders() } });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Undo failed');
  }
  return res.json();
}

export async function exploreFolder(folder: string): Promise<{ tree: any }> {
  const res = await fetch(`/api/explore-folder?folder=${encodeURIComponent(folder)}`, { headers: { ...authHeaders() } });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to explore folder');
  }
  return res.json();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let val = bytes;
  for (const unit of units) {
    if (Math.abs(val) < 1024.0) {
      return `${val.toFixed(1)} ${unit}`;
    }
    val /= 1024.0;
  }
  return `${val.toFixed(1)} PB`;
}
