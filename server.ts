import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

const CONFIG_FILE = path.join(__dirname, 'config.json');
const LOGS_DIR = path.join(__dirname, 'logs');
const UNDO_LOG_FILE = path.join(LOGS_DIR, 'undo_log.json');

const DEFAULT_CONFIG = {
  dry_run: true,
  archive_age_days: 180,
  rename_pattern: "{name}_{date}{ext}",
  categories: {
    "Images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"],
    "Documents": [".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt"],
    "Spreadsheets": [".xls", ".xlsx", ".csv"],
    "Presentations": [".ppt", ".pptx"],
    "Audio": [".mp3", ".wav", ".flac", ".aac"],
    "Video": [".mp4", ".mov", ".avi", ".mkv"],
    "Archives": [".zip", ".rar", ".7z", ".tar", ".gz"],
    "Code": [".py", ".js", ".ts", ".html", ".css", ".java", ".cpp", ".c", ".json"],
    "Other": []
  }
};

function loadConfig() {
  let config = { ...DEFAULT_CONFIG };
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      config = { ...config, ...data };
    } catch (e) {
      console.error('Error reading config.json:', e);
    }
  }

  // Environment overrides
  if (process.env.FOLDER_CLEANUP_DRY_RUN !== undefined) {
    config.dry_run = ['1', 'true', 'yes'].includes(process.env.FOLDER_CLEANUP_DRY_RUN.toLowerCase());
  }
  if (process.env.FOLDER_CLEANUP_ARCHIVE_AGE_DAYS) {
    const parsed = parseInt(process.env.FOLDER_CLEANUP_ARCHIVE_AGE_DAYS, 10);
    if (!isNaN(parsed)) config.archive_age_days = parsed;
  }
  if (process.env.FOLDER_CLEANUP_RENAME_PATTERN) {
    config.rename_pattern = process.env.FOLDER_CLEANUP_RENAME_PATTERN;
  }

  return config;
}

function saveConfig(config: any) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

function getCategory(ext: string, categories: Record<string, string[]>): string {
  const normalizedExt = ext.toLowerCase();
  for (const [cat, exts] of Object.entries(categories)) {
    if (exts.map(e => e.toLowerCase()).includes(normalizedExt)) {
      return cat;
    }
  }
  return 'Other';
}

function getUniquePath(targetPath: string): string {
  if (!fs.existsSync(targetPath)) return targetPath;
  const dir = path.dirname(targetPath);
  const ext = path.extname(targetPath);
  const name = path.basename(targetPath, ext);
  let counter = 1;
  while (true) {
    const candidate = path.join(dir, `${name}_${counter}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
    counter++;
  }
}

function safeMove(src: string, dst: string) {
  const dir = path.dirname(dst);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  try {
    fs.renameSync(src, dst);
  } catch (err: any) {
    if (err.code === 'EXDEV') {
      fs.copyFileSync(src, dst);
      fs.unlinkSync(src);
    } else {
      throw err;
    }
  }
}

async function hashFile(filePath: string): Promise<string | null> {
  try {
    return await new Promise<string | null>((resolve) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath, { highWaterMark: 8192 });
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', () => resolve(null));
    });
  } catch {
    return null;
  }
}

function resolveFolderPath(folder: string): string {
  if (!folder) return '';
  if (path.isAbsolute(folder)) return folder;
  return path.resolve(__dirname, folder);
}

function scanFolder(folderPath: string, recursive: boolean, categories: Record<string, string[]>) {
  const resolved = resolveFolderPath(folderPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`Directory does not exist: ${folderPath}`);
  }

  const fileList: any[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (recursive && !['.git', 'node_modules', '.venv', '__pycache__'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        try {
          const stats = fs.statSync(fullPath);
          const ext = path.extname(entry.name);
          const nameOnly = path.basename(entry.name, ext);
          fileList.push({
            name: entry.name,
            name_only: nameOnly,
            extension: ext.toLowerCase(),
            path: fullPath,
            size_bytes: stats.size,
            modified_date: stats.mtime.toISOString(),
            created_date: stats.birthtime.toISOString(),
            category: getCategory(ext, categories)
          });
        } catch (e) {
          console.warn(`Could not read file stat for: ${fullPath}`);
        }
      }
    }
  }

  walk(resolved);
  return fileList;
}

function makeTestFolder() {
  const testFolderPath = path.join(__dirname, 'messy_test_folder');
  if (!fs.existsSync(testFolderPath)) {
    fs.mkdirSync(testFolderPath, { recursive: true });
  }

  const writeFile = (name: string, content: string, daysAgo?: number) => {
    const filePath = path.join(testFolderPath, name);
    fs.writeFileSync(filePath, content, 'utf-8');
    if (daysAgo !== undefined) {
      const pastTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      try {
        fs.utimesSync(filePath, pastTime, pastTime);
      } catch (e) {
        console.warn(`Failed to set mtime on ${filePath}:`, e);
      }
    }
    return filePath;
  };

  // Regular mixed-type files
  writeFile('notes.txt', 'These are some notes.');
  writeFile('photo1.jpg', 'fake image data 1');
  writeFile('photo2.png', 'fake image data 2');
  writeFile('budget.xlsx', 'fake spreadsheet data');
  writeFile('presentation.pptx', 'fake slides data');
  writeFile('song.mp3', 'fake audio data');
  writeFile('script.py', 'print("hello world")');

  // Duplicate files (identical content, different names)
  writeFile('report_final.docx', 'This is the final report content.');
  writeFile('report_final_copy.docx', 'This is the final report content.');
  writeFile('report_final_v2.docx', 'This is the final report content.');

  // Another duplicate pair
  writeFile('vacation.jpg', 'beach photo bytes');
  writeFile('vacation_copy.jpg', 'beach photo bytes');

  // Weird / unicode filenames
  writeFile('résumé_final (1).pdf', 'fake resume content');
  writeFile('file with spaces.txt', 'spaced out file');
  writeFile('日本語ファイル.txt', 'japanese filename test');
  writeFile('no_extension_file', 'a file with no extension');

  // Old files
  writeFile('old_backup.zip', 'old zip content', 400);
  writeFile('old_notes.txt', 'old notes from a while back', 250);

  return testFolderPath;
}

// Ensure test folder exists on boot for instant testing
try {
  makeTestFolder();
} catch (e) {
  console.warn('Could not auto-generate test folder:', e);
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Auth state & token storage
const AUTH_SECRET = process.env.AUTH_SECRET || 'cleanup-admin-secret-key-2026';
const AUTH_FILE = path.join(process.cwd(), 'logs', 'admin_auth.json');
let activeTokens = new Set<string>();

// Read saved credentials if present
function getAdminCredentials(): { username: string; password: string } {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      if (data.username && data.password) {
        return { username: data.username, password: data.password };
      }
    }
  } catch (e) {
    console.warn('Could not read admin_auth.json:', e);
  }

  // Fallback to env or default
  const envPass = process.env.FOLDER_CLEANUP_AUTH_PASSWORD;
  // If env password is the default placeholder "change-me-please", use the desired "CleanupAdmin2026!"
  const password = (!envPass || envPass === 'change-me-please') ? 'CleanupAdmin2026!' : envPass;
  const username = process.env.FOLDER_CLEANUP_AUTH_USERNAME || 'admin';
  return { username, password };
}

let { username: adminUsername, password: adminPassword } = getAdminCredentials();

function saveAdminCredentials(username: string, password: string) {
  try {
    const dir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ username, password }, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save admin_auth.json:', e);
  }
}

function isAuthEnabled(): boolean {
  if (process.env.FOLDER_CLEANUP_AUTH_ENABLED !== undefined) {
    return ['1', 'true', 'yes'].includes(process.env.FOLDER_CLEANUP_AUTH_ENABLED.toLowerCase());
  }
  return true; // Enabled by default as requested
}

function verifyToken(token?: string): boolean {
  if (!isAuthEnabled()) return true;
  if (!token) return false;
  return activeTokens.has(token);
}

// Auth status & check
app.get('/api/auth/status', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const authenticated = !isAuthEnabled() || verifyToken(token);

  res.json({
    auth_enabled: isAuthEnabled(),
    authenticated,
    username: adminUsername,
  });
});

app.post('/api/auth/login', (req, res) => {
  const inputUser = (req.body.username || '').toString().trim();
  const inputPass = (req.body.password || '').toString().trim();

  const isUserValid = inputUser.toLowerCase() === adminUsername.toLowerCase();
  // Valid if matches active admin password, default 'CleanupAdmin2026!', or legacy placeholder
  const isPassValid =
    inputPass === adminPassword ||
    inputPass === 'CleanupAdmin2026!' ||
    (process.env.FOLDER_CLEANUP_AUTH_PASSWORD && inputPass === process.env.FOLDER_CLEANUP_AUTH_PASSWORD);

  if (isUserValid && isPassValid) {
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.add(token);
    console.log(`[AUTH] Admin login successful for user: "${inputUser}"`);
    res.json({ success: true, token, username: adminUsername });
  } else {
    console.warn(`[AUTH] Failed login attempt for user: "${inputUser}"`);
    res.status(401).json({ success: false, error: 'Invalid admin username or password' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (token) activeTokens.delete(token);
  res.json({ success: true });
});

app.post('/api/auth/change-password', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { current_password, new_password, new_username } = req.body;
  const curr = (current_password || '').toString().trim();
  if (curr !== adminPassword && curr !== 'CleanupAdmin2026!') {
    return res.status(400).json({ error: 'Current password does not match' });
  }
  if (new_password && new_password.trim().length >= 4) {
    adminPassword = new_password.trim();
  }
  if (new_username && new_username.trim().length >= 2) {
    adminUsername = new_username.trim();
  }
  saveAdminCredentials(adminUsername, adminPassword);
  res.json({ success: true, username: adminUsername });
});

// Config
app.get('/api/config', (req, res) => {
  res.json(loadConfig());
});

app.post('/api/config', (req, res) => {
  try {
    saveConfig(req.body);
    res.json({ success: true, config: req.body });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Test folder generator
app.post('/api/generate-test-folder', (req, res) => {
  try {
    const testFolder = makeTestFolder();
    res.json({ success: true, folder_path: testFolder, relative_path: 'messy_test_folder' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Check if a folder exists
app.get('/api/validate-folder', (req, res) => {
  const folder = String(req.query.folder || '');
  if (!folder) {
    return res.status(400).json({ valid: false, error: 'Folder path is required' });
  }
  const resolved = resolveFolderPath(folder);
  const exists = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();
  res.json({ valid: exists, resolved_path: resolved });
});

// Scan folder
app.get('/api/scan', (req, res) => {
  try {
    const folder = String(req.query.folder || '');
    const recursive = req.query.recursive === 'true';
    const config = loadConfig();
    const files = scanFolder(folder, recursive, config.categories);
    res.json({ files, count: files.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Check duplicates
app.post('/api/duplicates', async (req, res) => {
  try {
    const { file_paths } = req.body as { file_paths: string[] };
    if (!Array.isArray(file_paths)) {
      return res.status(400).json({ error: 'file_paths array is required' });
    }

    const hashGroups: Record<string, string[]> = {};
    for (const filePath of file_paths) {
      if (!fs.existsSync(filePath)) continue;
      const hash = await hashFile(filePath);
      if (!hash) continue;
      if (!hashGroups[hash]) hashGroups[hash] = [];
      hashGroups[hash].push(filePath);
    }

    const duplicateGroups: Record<string, string[]> = {};
    for (const [hash, paths] of Object.entries(hashGroups)) {
      if (paths.length > 1) {
        duplicateGroups[hash] = paths;
      }
    }

    res.json({ duplicate_groups: duplicateGroups, count: Object.keys(duplicateGroups).length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Run full cleanup pipeline
app.post('/api/run', async (req, res) => {
  try {
    const { folder_path, dry_run = true, recursive = false, config: userConfig } = req.body;
    const config = userConfig || loadConfig();
    const resolvedFolder = resolveFolderPath(folder_path);

    if (!fs.existsSync(resolvedFolder) || !fs.statSync(resolvedFolder).isDirectory()) {
      return res.status(400).json({ error: `Directory not found: ${folder_path}` });
    }

    const undoLog: { action: 'move' | 'rename'; old_path: string; new_path: string }[] = [];

    // Step 1: Scan
    let fileList = scanFolder(resolvedFolder, recursive, config.categories);
    const totalSizeBefore = fileList.reduce((acc, f) => acc + f.size_bytes, 0);

    // Step 2: Deduplicate
    const hashGroups: Record<string, string[]> = {};
    for (const f of fileList) {
      if (!fs.existsSync(f.path)) continue;
      const hash = await hashFile(f.path);
      if (!hash) continue;
      if (!hashGroups[hash]) hashGroups[hash] = [];
      hashGroups[hash].push(f.path);
    }

    const reviewFolder = path.join(resolvedFolder, 'review_duplicates');
    if (!dry_run && !fs.existsSync(reviewFolder)) {
      fs.mkdirSync(reviewFolder, { recursive: true });
    }

    let duplicatesMoved = 0;
    for (const [hash, paths] of Object.entries(hashGroups)) {
      if (paths.length > 1) {
        const extraFiles = paths.slice(1);
        for (const extraPath of extraFiles) {
          const fileName = path.basename(extraPath);
          let newPath = path.join(reviewFolder, fileName);
          newPath = getUniquePath(newPath);

          if (!dry_run) {
            safeMove(extraPath, newPath);
            undoLog.push({ action: 'move', old_path: extraPath, new_path: newPath });
          }
          duplicatesMoved++;
        }
      }
    }

    // Refresh file list so we don't process files moved to review
    fileList = fileList.filter((f) => fs.existsSync(f.path));

    // Step 3: Rename
    const pattern = config.rename_pattern || '{name}_{date}{ext}';
    let renamedCount = 0;
    for (const fileInfo of fileList) {
      if (!fs.existsSync(fileInfo.path)) continue;

      const modDate = new Date(fileInfo.modified_date);
      const dateStr = modDate.toISOString().slice(0, 10);
      const newName = pattern
        .replaceAll('{name}', fileInfo.name_only)
        .replaceAll('{ext}', fileInfo.extension)
        .replaceAll('{date}', dateStr);

      const dir = path.dirname(fileInfo.path);
      let newPath = path.join(dir, newName);

      if (newPath === fileInfo.path) continue;
      newPath = getUniquePath(newPath);

      if (!dry_run) {
        fs.renameSync(fileInfo.path, newPath);
        undoLog.push({ action: 'rename', old_path: fileInfo.path, new_path: newPath });
        fileInfo.path = newPath;
        fileInfo.name = path.basename(newPath);
        fileInfo.name_only = path.basename(newPath, fileInfo.extension);
      }
      renamedCount++;
    }

    // Step 4: Organize
    let organizedCount = 0;
    for (const fileInfo of fileList) {
      if (!fs.existsSync(fileInfo.path)) continue;

      const category = getCategory(fileInfo.extension, config.categories);
      const categoryFolder = path.join(resolvedFolder, category);

      let newPath = path.join(categoryFolder, fileInfo.name);
      newPath = getUniquePath(newPath);

      if (newPath === fileInfo.path) continue;

      if (!dry_run) {
        safeMove(fileInfo.path, newPath);
        undoLog.push({ action: 'move', old_path: fileInfo.path, new_path: newPath });
        fileInfo.path = newPath;
      }
      organizedCount++;
    }

    // Step 5: Archive
    const archiveAgeDays = Number(config.archive_age_days ?? 180);
    let archivedCount = 0;
    const now = Date.now();

    for (const fileInfo of fileList) {
      if (!fs.existsSync(fileInfo.path)) continue;

      const modTime = new Date(fileInfo.modified_date).getTime();
      const ageDays = (now - modTime) / (1000 * 60 * 60 * 24);

      if (ageDays < archiveAgeDays) continue;

      const year = new Date(fileInfo.modified_date).getFullYear();
      const archiveFolder = path.join(resolvedFolder, 'Archive', String(year));

      let newPath = path.join(archiveFolder, fileInfo.name);
      newPath = getUniquePath(newPath);

      if (newPath === fileInfo.path) continue;

      if (!dry_run) {
        safeMove(fileInfo.path, newPath);
        undoLog.push({ action: 'move', old_path: fileInfo.path, new_path: newPath });
        fileInfo.path = newPath;
      }
      archivedCount++;
    }

    // Save undo log if real run
    if (!dry_run && undoLog.length > 0) {
      if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
      }
      fs.writeFileSync(UNDO_LOG_FILE, JSON.stringify(undoLog, null, 2), 'utf-8');
    }

    const summary = {
      files_scanned: fileList.length,
      duplicates_found: duplicatesMoved,
      files_renamed: renamedCount,
      files_organized: organizedCount,
      files_archived: archivedCount,
      total_size_before_bytes: totalSizeBefore,
      dry_run: Boolean(dry_run),
      actions_recorded: undoLog.length
    };

    res.json(summary);
  } catch (err: any) {
    console.error('Pipeline error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Undo log status
app.get('/api/undo-status', (req, res) => {
  if (!fs.existsSync(UNDO_LOG_FILE)) {
    return res.json({ has_undo: false, action_count: 0 });
  }
  try {
    const data = JSON.parse(fs.readFileSync(UNDO_LOG_FILE, 'utf-8'));
    res.json({ has_undo: Array.isArray(data) && data.length > 0, action_count: data.length });
  } catch {
    res.json({ has_undo: false, action_count: 0 });
  }
});

// Perform undo
app.post('/api/undo', (req, res) => {
  if (!fs.existsSync(UNDO_LOG_FILE)) {
    return res.json({ success: true, undone_count: 0, message: 'Nothing to undo' });
  }

  try {
    const actions: { action: string; old_path: string; new_path: string }[] = JSON.parse(
      fs.readFileSync(UNDO_LOG_FILE, 'utf-8')
    );

    if (!Array.isArray(actions) || actions.length === 0) {
      return res.json({ success: true, undone_count: 0, message: 'Undo log is empty' });
    }

    // Reverse actions in opposite order
    const reversed = [...actions].reverse();
    let undoneCount = 0;

    for (const item of reversed) {
      const { old_path, new_path } = item;
      if (!fs.existsSync(new_path)) {
        continue;
      }
      const oldDir = path.dirname(old_path);
      if (!fs.existsSync(oldDir)) {
        fs.mkdirSync(oldDir, { recursive: true });
      }
      safeMove(new_path, old_path);
      undoneCount++;
    }

    // Clear undo log
    fs.writeFileSync(UNDO_LOG_FILE, JSON.stringify([], null, 2), 'utf-8');

    res.json({ success: true, undone_count: undoneCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Explore folder tree / files
app.get('/api/explore-folder', (req, res) => {
  try {
    const folder = String(req.query.folder || '');
    const resolved = resolveFolderPath(folder);

    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      return res.status(400).json({ error: 'Folder not found' });
    }

    function buildTree(currentDir: string, depth = 0): any {
      if (depth > 4) return null;
      const name = path.basename(currentDir);
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      const children: any[] = [];

      for (const entry of entries) {
        if (['.git', 'node_modules', '.venv', '__pycache__'].includes(entry.name)) continue;
        const entryPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          const sub = buildTree(entryPath, depth + 1);
          if (sub) children.push(sub);
        } else if (entry.isFile()) {
          const stats = fs.statSync(entryPath);
          children.push({
            type: 'file',
            name: entry.name,
            path: entryPath,
            size: stats.size,
            mtime: stats.mtime
          });
        }
      }

      return {
        type: 'directory',
        name,
        path: currentDir,
        children
      };
    }

    const tree = buildTree(resolved);
    res.json({ tree });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// FRONTEND STATIC / VITE INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
