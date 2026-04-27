/**
 * US-IDE — Electron Main Process
 * Professional VS Code-style desktop IDE
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, shell, session } = require('electron');

// Enable Speech API in Electron
app.commandLine.appendSwitch('enable-speech-input');
app.commandLine.appendSwitch('enable-media-stream');
app.commandLine.appendSwitch('disable-features', 'FedCm');

let pty;
try {
  pty = require('node-pty');
} catch (e) {
  console.error('[US-IDE] Failed to load node-pty:', e.message);
}
const path = require('path');

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('uside', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('uside');
}

const { execFile, spawn } = require('child_process');
const fs = require('fs');
const chokidar = require('chokidar');
const os = require('os');

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const WORKSPACE_FILE = path.join(os.homedir(), '.uside-workspace.json');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let currentProcess = null; // Track the running user process
let activeWatchers = {}; // directory path → fs.FSWatcher
let terminals = {}; // id → ptyProcess

// ─────────────────────────────────────────────
// Workspace Persistence
// ─────────────────────────────────────────────

function readWorkspace() {
  try {
    if (fs.existsSync(WORKSPACE_FILE)) {
      const data = JSON.parse(fs.readFileSync(WORKSPACE_FILE, 'utf8'));
      return data;
    }
  } catch (e) {
    console.error('[US-IDE] Failed to read workspace file:', e.message);
  }
  return { lastPath: null };
}

function writeWorkspace(data) {
  try {
    fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[US-IDE] Failed to write workspace file:', e.message);
  }
}

// ─────────────────────────────────────────────
// Window Creation
// ─────────────────────────────────────────────

function handleDeepLink(url) {
  if (!url) return;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'uside:' && parsedUrl.hostname === 'auth') {
      const token = parsedUrl.searchParams.get('token');
      const userData = parsedUrl.searchParams.get('user');
      if (token && userData && mainWindow) {
        mainWindow.webContents.send('auth-success', { token, user: JSON.parse(decodeURIComponent(userData)) });
        mainWindow.focus();
      }
    }
  } catch (e) {
    console.error('[DeepLink] Error parsing URL:', e.message);
  }
}

// Force single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      // On Windows, the deep link URL is passed in the command line
      const url = commandLine.pop();
      handleDeepLink(url);
    }
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
  });
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('[US-IDE] Preload path:', preloadPath);
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: false, // Temporarily disable for debugging
    },
    frame: false,
    title: 'US-IDE',
    icon: path.join(__dirname, 'icon.ico'),
    backgroundColor: '#0a0a0f', // Set background color to match app
    show: true, // Show immediately
  });

  // Temporarily disable CSP override to rule it out
  /*
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    ...
  });
  */

  const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  
  // Try multiple path strategies
  const appPath = app.getAppPath();
  const path1 = path.join(appPath, 'frontend', 'dist', 'index.html');
  const path2 = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  
  let finalPath = '';
  if (fs.existsSync(path1)) {
    finalPath = path1;
  } else if (fs.existsSync(path2)) {
    finalPath = path2;
  }

  if (!isDev && !finalPath) {
    const debugInfo = `
App Path: ${appPath}
__dirname: ${__dirname}
Checked Path 1: ${path1}
Checked Path 2: ${path2}
Contents of App Path: ${fs.readdirSync(appPath).join(', ')}
    `;
    dialog.showErrorBox('Critical Error: index.html not found', `Could not find the frontend files. The application will not load.\n\nDebug Info:\n${debugInfo}`);
    app.quit();
    return;
  }

  if (isDev) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    console.log('[US-IDE] Loading file:', finalPath);
    mainWindow.loadFile(finalPath).catch(err => {
      dialog.showErrorBox('Load Error', `Failed to load index.html: ${err.message}\nPath: ${finalPath}`);
    });
    // Keep DevTools open for now
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    const msg = `Failed to load: ${url}\nError Code: ${code}\nDescription: ${desc}`;
    console.error('[US-IDE] did-fail-load', msg);
    if (!isDev) {
      dialog.showErrorBox('Load Failure', msg);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[US-IDE] Content loaded successfully');
  });

  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    console.error('[US-IDE] render-process-gone', details);
  });

  // Save workspace on close
  mainWindow.on('close', () => {
    // Cleanup all watchers
    Object.values(activeWatchers).forEach(w => { try { w.close(); } catch (_) { } });
    activeWatchers = {};
  });
}

// ─────────────────────────────────────────────
// Application Menu Bar
// ─────────────────────────────────────────────

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu-open-file'),
        },
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => mainWindow?.webContents.send('menu-open-folder'),
        },
        { type: 'separator' },
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-new-file'),
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-save'),
        },
        { type: 'separator' },
        {
          label: 'Close Window',
          accelerator: 'Alt+F4',
          role: 'close',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Terminal',
          accelerator: 'CmdOrCtrl+`',
          click: () => mainWindow?.webContents.send('menu-toggle-terminal'),
        },
        {
          label: 'Command Palette...',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => mainWindow?.webContents.send('menu-command-palette'),
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [
          { type: 'separator' },
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
        ] : []),
      ],
    },
    {
      label: 'Run',
      submenu: [
        {
          label: 'Run Active File',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => mainWindow?.webContents.send('menu-run'),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'US-IDE on GitHub',
          click: () => shell.openExternal('https://github.com'),
        },
        { type: 'separator' },
        {
          label: `Version ${app.getVersion()}`,
          enabled: false,
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ─────────────────────────────────────────────
// App Lifecycle
// ─────────────────────────────────────────────

app.on('ready', () => {
  // Handle permissions for microphone access (Voice Search)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media'];
    if (allowedPermissions.includes(permission)) {
      callback(true); // Approve microphone access
    } else {
      callback(false); // Deny others
    }
  });

  buildMenu();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ─────────────────────────────────────────────
// Helper: Path Safety Check
// ─────────────────────────────────────────────

function buildTreeRecursive(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries
      .filter(e => !e.name.startsWith('.') || e.name === '.gitignore')
      .map(e => {
        const fullPath = path.join(dirPath, e.name);
        const isDirectory = e.isDirectory();
        return {
          name: e.name,
          isDirectory,
          path: fullPath,
          children: isDirectory ? buildTreeRecursive(fullPath) : undefined
        };
      });
  } catch (e) {
    return [];
  }
}

function isInside(root, target) {
  if (!root || !target) return false;
  const r = path.resolve(root);
  const t = path.resolve(target);
  return t === r || t.startsWith(r + path.sep);
}

// ─────────────────────────────────────────────
// Helper: Check if executable exists
// ─────────────────────────────────────────────

async function resolveExecutable(command, candidates = []) {
  // Try PATH via `where`
  const foundViaWhere = await new Promise((resolve) => {
    execFile('where', [command], { windowsHide: true }, (error, stdout) => {
      if (!error && stdout) {
        const first = stdout.toString().split(/\r?\n/).filter(Boolean)[0];
        resolve(first || null);
      } else {
        resolve(null);
      }
    });
  });
  if (foundViaWhere) return foundViaWhere;

  // Try common Windows locations
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) { }
  }
  return null;
}



// ─────────────────────────────────────────────
// IPC: Workspace Persistence
// ─────────────────────────────────────────────

ipcMain.handle('get-workspace', async () => {
  return readWorkspace();
});

ipcMain.handle('save-workspace', async (_event, data) => {
  writeWorkspace(data);
  return { success: true };
});

// ─────────────────────────────────────────────
// IPC: File System — Directory
// ─────────────────────────────────────────────

ipcMain.handle('open-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Open Folder — US-IDE',
  });
  if (canceled || filePaths.length === 0) return null;
  // Persist last workspace
  writeWorkspace({ lastPath: filePaths[0] });
  return filePaths[0];
});

ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Folder — US-IDE',
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

ipcMain.handle('read-dir', async (_event, dirPath, recursive = false) => {
  try {
    if (recursive) {
      return {
        success: true,
        files: buildTreeRecursive(dirPath)
      };
    }
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return {
      success: true,
      files: entries
        .filter(e => !e.name.startsWith('.') || e.name === '.gitignore') // hide dot files except .gitignore
        .map(e => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          path: path.join(dirPath, e.name),
        })),
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('create-folder', async (_event, workspaceRoot, dirPath) => {
  if (!isInside(workspaceRoot, dirPath)) {
    return { success: false, error: 'Attempted to create directory outside of workspace.' };
  }
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ─────────────────────────────────────────────
// IPC: File System — Files
// ─────────────────────────────────────────────

ipcMain.handle('open-file', async (_event, manualPath) => {
  if (manualPath) {
    try {
      const content = fs.readFileSync(manualPath, 'utf8');
      return { path: manualPath, content };
    } catch (e) {
      return { error: e.message };
    }
  }
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: 'Open File — US-IDE',
    filters: [
      { name: 'Code Files', extensions: ['py', 'c', 'cpp', 'java', 'js', 'ts', 'typescript', 'html', 'css', 'json', 'md', 'txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (canceled || filePaths.length === 0) return null;
  try {
    const content = fs.readFileSync(filePaths[0], 'utf8');
    return { path: filePaths[0], content };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('save-file', async (_event, workspaceRoot, filePath, content) => {
  if (!isInside(workspaceRoot, filePath)) {
    return { success: false, error: 'Attempted to save file outside of workspace.' };
  }
  try {
    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('create-file', async (_event, workspaceRoot, filePath, content = '') => {
  if (!isInside(workspaceRoot, filePath)) {
    return { success: false, error: 'Attempted to create file outside of workspace.' };
  }
  try {
    // Ensure parent directory exists before writing file
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('rename-file', async (_event, workspaceRoot, targetPath, newName) => {
  try {
    const dir = path.dirname(targetPath);
    const newPath = path.join(dir, newName);

    // Path sanity check
    if (workspaceRoot && (!isInside(workspaceRoot, targetPath) || !isInside(workspaceRoot, newPath))) {
      return { success: false, error: 'Operation outside workspace is not allowed' };
    }

    // Windows Case-Only Rename Handle:
    // fs.rename on Windows fails or does nothing if renaming "file.txt" to "File.txt"
    if (process.platform === 'win32' && targetPath.toLowerCase() === newPath.toLowerCase() && targetPath !== newPath) {
      const tempPath = targetPath + '.tmp_rename';
      await fs.promises.rename(targetPath, tempPath);
      await fs.promises.rename(tempPath, newPath);
    } else {
      await fs.promises.rename(targetPath, newPath);
    }

    return { success: true, path: newPath };
  } catch (e) {
    console.error('[Main] Rename Error:', e.message);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('delete-file', async (_event, workspaceRoot, targetPath) => {
  try {
    if (workspaceRoot && !isInside(workspaceRoot, targetPath)) {
      return { success: false, error: 'Operation outside workspace is not allowed' };
    }
    // Use fs.promises.rm which can handle both files and directories recursively.
    // This is simpler, non-blocking, and more consistent than the previous implementation.
    await fs.promises.rm(targetPath, { recursive: true });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ─────────────────────────────────────────────
// IPC: Create Project (wizard flow)
// ─────────────────────────────────────────────

ipcMain.handle('create-project', async (_event, folderPath, projectName, language, fileName, content) => {
  try {
    const projectDir = path.join(folderPath, projectName);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    const filePath = path.join(projectDir, fileName);
    fs.writeFileSync(filePath, content || '', 'utf8');
    writeWorkspace({ lastPath: projectDir });
    return { success: true, projectPath: projectDir, filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ─────────────────────────────────────────────
// IPC: File System Watch
// ─────────────────────────────────────────────

ipcMain.handle('watch-dir', async (_event, dirPath) => {
  if (!dirPath) return { success: false, error: 'No directory path provided' };
  // Stop existing watcher for this path
  if (activeWatchers[dirPath]) {
    try { activeWatchers[dirPath].close(); } catch (_) { }
    delete activeWatchers[dirPath];
  }
  try {
    const watcher = chokidar.watch(dirPath, {
      persistent: true,
      ignoreInitial: true,
      depth: 99,
    });
    const emitChange = (eventType, filePath) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('dir-changed', { dirPath, eventType, filename: path.basename(filePath), path: filePath });
      }
    };
    watcher.on('add', (p) => emitChange('add', p));
    watcher.on('addDir', (p) => emitChange('addDir', p));
    watcher.on('change', (p) => emitChange('change', p));
    watcher.on('unlink', (p) => emitChange('unlink', p));
    watcher.on('unlinkDir', (p) => emitChange('unlinkDir', p));
    activeWatchers[dirPath] = watcher;
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('unwatch-dir', async (_event, dirPath) => {
  if (activeWatchers[dirPath]) {
    try { activeWatchers[dirPath].close(); } catch (_) { }
    delete activeWatchers[dirPath];
  }
  return { success: true };
});

// ─────────────────────────────────────────────
// IPC: Code Execution (DEPRECATED: Using PTY Instead)
// ─────────────────────────────────────────────

ipcMain.handle('execute-code', () => {
  console.warn('[Main] execute-code disabled: using PTY terminal instead');
  return { success: false, error: 'DEPRECATED: Using PTY terminal instead' };
});

ipcMain.handle('stop-process', () => {
  console.warn('[Main] stop-process disabled: using Ctrl+C in PTY instead');
  return { success: true };
});

// ─────────────────────────────────────────────
// IPC: Terminal (node-pty)
// ─────────────────────────────────────────────

ipcMain.handle('terminal-create', (event, id, cwd) => {
  const isWin = process.platform === 'win32';
  
  // 1. Resolve Shell
  let shellPath = isWin ? 'powershell.exe' : 'bash';
  if (isWin) {
    const commonPaths = [
      'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', // Prefer PowerShell
      process.env.COMSPEC, // cmd.exe
      'C:\\Windows\\System32\\cmd.exe',
      'powershell.exe',
      'cmd.exe'
    ];
    for (const p of commonPaths) {
      if (p) {
        try {
          // If it's a full path, check if it exists. If it's just a name, assume it's in PATH.
          if (path.isAbsolute(p)) {
            if (fs.existsSync(p)) {
              shellPath = p;
              break;
            }
          } else {
            shellPath = p; // Assume it's in PATH (like 'powershell.exe')
            break;
          }
        } catch (_) {}
      }
    }
  }

  // 2. Resolve CWD
  let finalCwd = os.homedir();
  if (cwd) {
    try {
      const resolvedCwd = path.resolve(cwd);
      if (fs.existsSync(resolvedCwd) && fs.statSync(resolvedCwd).isDirectory()) {
        finalCwd = resolvedCwd;
      }
    } catch (e) {
      console.warn(`[Terminal] Invalid CWD: ${cwd}, falling back to home.`);
    }
  }

  // 3. Spawn PTY
  try {
    // Sanitize environment variables to prevent inheritance of VS Code specific settings
    // if US-IDE is being run from within VS Code's terminal.
    const sanitizedEnv = { ...process.env };
    const varsToRemove = [
      'TERM_PROGRAM',
      'TERM_PROGRAM_VERSION',
      'VSCODE_GIT_IPC_HANDLE',
      'VSCODE_GIT_ASKPASS_NODE',
      'VSCODE_GIT_ASKPASS_MAIN',
      'VSCODE_GIT_ASKPASS_EXTRA_ARGS',
      'VSCODE_IPC_HOOK_CLI',
      'VSCODE_NODE_JS_DIE_ON_UNCaught_EXCEPTION',
      'VSCODE_STDOUT_LOG_LEVEL',
      'VSCODE_VERBOSE_LOGGING',
      'ELECTRON_RUN_AS_NODE',
      'VSCODE_LOG_STACK',
      'VSCODE_LOG_LEVEL',
      'VSCODE_CLI',
      'VSCODE_AMD_ENTRYPOINT',
      'VSCODE_CWD',
      'VSCODE_HANDLES_UNCAUGHT_ERRORS',
      'VSCODE_IPC_HOOK',
      'VSCODE_NLS_CONFIG',
      'VSCODE_PORT',
      'VSCODE_PID'
    ];
    varsToRemove.forEach(v => delete sanitizedEnv[v]);

    // Use -NoProfile to avoid loading external scripts that might hijack the shell
    const shellArgs = (isWin && shellPath.toLowerCase().includes('powershell')) ? ['-NoProfile', '-ExecutionPolicy', 'Bypass'] : [];

    const ptyProcess = pty.spawn(shellPath, shellArgs, {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: finalCwd,
      useConpty: true, // Use modern Windows PTY for better interactive app support
      env: { 
        ...sanitizedEnv, 
        LANG: 'en_US.UTF-8',
        TERM: 'xterm-256color'
      },
    });

    terminals[id] = ptyProcess;

    ptyProcess.onData((data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(`terminal-data-${id}`, data);
      }
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(`terminal-exit-${id}`, { exitCode, signal });
      }
      delete terminals[id];
    });

    return true;
  } catch (err) {
    const errorMsg = `PTY Spawn Error: ${err.message}. Shell: ${shellPath}, CWD: ${finalCwd}`;
    console.error(`[Terminal Create] ${errorMsg}`, err);
    throw new Error(errorMsg);
  }
});

ipcMain.handle('terminal-write', (_event, id, data) => {
  if (terminals[id]) {
    terminals[id].write(data);
    return true;
  }
  return false;
});

ipcMain.handle('terminal-resize', (_event, id, { cols, rows }) => {
  if (terminals[id]) {
    terminals[id].resize(cols, rows);
    return true;
  }
  return false;
});

ipcMain.handle('terminal-kill', (_event, id) => {
  if (terminals[id]) {
    terminals[id].kill();
    delete terminals[id];
    return true;
  }
  return false;
});









// ─────────────────────────────────────────────
// IPC: Window Management
// ─────────────────────────────────────────────

ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow?.close();
});

// ─────────────────────────────────────────────
// IPC: Authentication
// ─────────────────────────────────────────────

ipcMain.handle('open-external', async (_event, url) => {
  if (url) {
    shell.openExternal(url);
    return true;
  }
  return false;
});

ipcMain.handle('clipboard-copy', async (_event, text) => {
  const { clipboard } = require('electron');
  if (text) {
    clipboard.writeText(text);
    return true;
  }
  return false;
});

// ─────────────────────────────────────────────
// IPC: Version Info
// ─────────────────────────────────────────────

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});
