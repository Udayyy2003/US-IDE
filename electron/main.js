/**
 * US-IDE — Electron Main Process
 * Professional VS Code-style desktop IDE
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, 'icon.ico'),
    show: false, // show after ready-to-show
  });

  // Show when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  const prodIndex = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');

  if (isDev) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(prodIndex);
  }

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[US-IDE] did-fail-load', code, desc, url);
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
// Helper: Send terminal event to renderer
// ─────────────────────────────────────────────

function sendTerminal(data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('terminal-output', data);
  }
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

ipcMain.handle('read-dir', async (_event, dirPath) => {
  try {
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
      { name: 'Code Files', extensions: ['py', 'c', 'cpp', 'java', 'js', 'ts', 'html', 'css', 'json', 'md', 'txt'] },
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

ipcMain.handle('create-file', async (_event, workspaceRoot, filePath) => {
  if (!isInside(workspaceRoot, filePath)) {
    return { success: false, error: 'Attempted to create file outside of workspace.' };
  }
  try {
    if (!fs.existsSync(filePath)) {
      // Ensure parent directory exists before writing file
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, '', 'utf8');
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('rename-file', async (_event, workspaceRoot, targetPath, newName) => {
  try {
    const dir = path.dirname(targetPath);
    const newPath = path.join(dir, newName);
    if (workspaceRoot && (!isInside(workspaceRoot, targetPath) || !isInside(workspaceRoot, newPath))) {
      return { success: false, error: 'Operation outside workspace is not allowed' };
    }
    fs.renameSync(targetPath, newPath);
    return { success: true, path: newPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('delete-file', async (_event, workspaceRoot, targetPath) => {
  try {
    if (workspaceRoot && !isInside(workspaceRoot, targetPath)) {
      return { success: false, error: 'Operation outside workspace is not allowed' };
    }
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }
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

ipcMain.handle('terminal-input', (_event, data) => {
    if (currentProcess && currentProcess.stdin && currentProcess.stdin.writable) {
      // Windows programs usually expect \r\n for line endings in stdin
      const chunk = data === '\r' ? '\r\n' : data;
      currentProcess.stdin.write(chunk, 'utf-8');
    }
  });

// ─────────────────────────────────────────────
// IPC: Code Execution
// ─────────────────────────────────────────────

ipcMain.handle('execute-code', async (_event, { language, filePath, projectPath }) => {
  if (!filePath) {
    sendTerminal({ type: 'error', text: 'No file to run.' });
    return;
  }

  const fileName = path.basename(filePath);
  const cwd = projectPath || path.dirname(filePath);

  // Header
  sendTerminal({ type: 'system', text: `\r\n\x1b[36m► Running ${fileName}\x1b[0m\r\n` });

  const commandMap = {
    python: { check: 'python', command: 'python', args: [filePath], fallback: 'py' },
    c: { check: 'gcc', compile: 'gcc', run: path.join(cwd, path.basename(filePath, '.c') + '.exe') },
    cpp: { check: 'g++', compile: 'g++', run: path.join(cwd, path.basename(filePath, '.cpp') + '.exe') },
    java: { check: 'javac', compile: 'javac', run: 'java', className: path.basename(filePath, '.java') },
  };

  const lang = commandMap[language];
  if (!lang) {
    sendTerminal({ type: 'error', text: `\x1b[31m✗ Unsupported language: ${language}\x1b[0m\r\n` });
    sendTerminal({ type: 'done', exitCode: 1 });
    return;
  }

  // Resolve compiler/runtime with Windows-friendly fallbacks
  const candidates = {
    gcc: [
      'C:\\msys64\\mingw64\\bin\\gcc.exe',
      'C:\\msys64\\mingw32\\bin\\gcc.exe',
      'C:\\MinGW\\bin\\gcc.exe',
      'C:\\Program Files\\mingw-w64\\mingw64\\bin\\gcc.exe',
      'C:\\Program Files\\mingw-w64\\bin\\gcc.exe',
      'C:\\TDM-GCC-64\\bin\\gcc.exe',
    ],
    'g++': [
      'C:\\msys64\\mingw64\\bin\\g++.exe',
      'C:\\msys64\\mingw32\\bin\\g++.exe',
      'C:\\MinGW\\bin\\g++.exe',
      'C:\\Program Files\\mingw-w64\\mingw64\\bin\\g++.exe',
      'C:\\Program Files\\mingw-w64\\bin\\g++.exe',
      'C:\\TDM-GCC-64\\bin\\g++.exe',
    ],
    python: [
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python314', 'python.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python313', 'python.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python312', 'python.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python310', 'python.exe'),
      'C:\\Python314\\python.exe',
      'C:\\Python313\\python.exe',
      'C:\\Python312\\python.exe',
      'C:\\Python311\\python.exe',
      'C:\\Program Files\\Python314\\python.exe',
      'C:\\Program Files\\Python313\\python.exe',
      'C:\\Program Files\\Python312\\python.exe',
      'C:\\Program Files\\Python311\\python.exe',
    ],
    javac: [],
    clang: ['C:\\Program Files\\LLVM\\bin\\clang.exe'],
    'clang++': ['C:\\Program Files\\LLVM\\bin\\clang++.exe'],
  };

  let toolPath = await resolveExecutable(lang.check, candidates[lang.check] || []);

  // Python fallback to py launcher
  if (!toolPath && language === 'python') {
    const pyLauncher = await resolveExecutable('py', []);
    if (pyLauncher) {
      lang.command = 'py';
      toolPath = pyLauncher;
    }
  }

  // Fallback to clang/clang++ if GCC/G++ not found
  const fallback = { gcc: 'clang', 'g++': 'clang++' }[lang.check];
  if (!toolPath && fallback) {
    const fbPath = await resolveExecutable(fallback, candidates[fallback] || []);
    if (fbPath) {
      lang.compile = fallback; // use fallback compiler
      toolPath = fbPath;
    }
  }

  // If still missing, print actionable install steps
  if (!toolPath) {
    const steps = {
      gcc: `• GCC (MinGW-w64) not found.\r\n\r\nSteps to install on Windows:\r\n1) Install MSYS2 (https://www.msys2.org)\r\n2) Open "MSYS2 MSYS" and run:\r\n   pacman -S mingw-w64-x86_64-gcc\r\n3) Add to PATH:\r\n   C:\\msys64\\mingw64\\bin\r\n4) Reopen US-IDE\r\n\r\nAlternative: Install MinGW-w64 and add its bin folder to PATH.\r\n`,
      'g++': `• G++ (MinGW-w64) not found.\r\n\r\nSteps to install on Windows:\r\n1) Install MSYS2 (https://www.msys2.org)\r\n2) Open "MSYS2 MSYS" and run:\r\n   pacman -S mingw-w64-x86_64-gcc\r\n3) Ensure mingw64\\bin has g++.exe and is in PATH.\r\n4) Reopen US-IDE\r\n\r\nAlternative: Install LLVM (clang++) and add C:\\Program Files\\LLVM\\bin to PATH.\r\n`,
      python: `• Python not found. Download from https://python.org and check "Add python.exe to PATH".\r\n`,
      javac: `• JDK not found. Install from https://adoptium.net and add JDK\\bin to PATH.\r\n`,
    };
    sendTerminal({
      type: 'error',
      text: `\x1b[31m✗ ${lang.check} not found.\x1b[0m\r\n${steps[lang.check] || ''}`,
    });
    sendTerminal({ type: 'done', exitCode: 1 });
    return;
  }

  // Helper: run a process and stream output
  const runProcess = (cmd, args, workDir, extraPathDir, useShell = true) => {
    return new Promise((resolve) => {
      const env = { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: '1' };
      if (extraPathDir) {
        const pathKey = process.platform === 'win32' ? 'Path' : 'PATH';
        env[pathKey] = `${extraPathDir}${path.delimiter}${env[pathKey] || ''}`;
      }
      
      // On Windows, use shell: true for compilers/interpreters, 
      // but direct execution for compiled binaries to improve interactivity.
      currentProcess = spawn(cmd, args, { 
        cwd: workDir, 
        windowsHide: true, 
        env, 
        shell: useShell,
        stdio: ['pipe', 'pipe', 'pipe'] 
      });

      if (currentProcess.stdin) {
        currentProcess.stdin.setEncoding('utf-8');
      }

      currentProcess.stdout.on('data', (data) => {
        const text = data.toString()
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\n/g, '\r\n');
        sendTerminal({ type: 'stdout', text });
      });

      currentProcess.stderr.on('data', (data) => {
        const text = data.toString()
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\n/g, '\r\n');
        sendTerminal({ type: 'stderr', text: `\x1b[31m${text}\x1b[0m` });
      });

      currentProcess.on('close', (code) => {
        currentProcess = null;
        resolve(code);
      });

      currentProcess.on('error', (err) => {
        sendTerminal({ type: 'error', text: `\x1b[31m✗ Process error: ${err.message}\x1b[0m\r\n` });
        currentProcess = null;
        resolve(1);
      });
    });
  };

  let exitCode = 0;

  // Execute based on language

  if (language === 'python') {
    // toolPath already resolved via candidates + PATH
    // Use useShell: false to avoid quoting issues with spaces in paths on Windows
    exitCode = await runProcess(toolPath, [filePath], cwd, path.dirname(toolPath), false);
  }
  else if (language === 'c' || language === 'cpp') {
    // ...
    const buildDir = path.join(cwd, 'build');
    try { if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true }); } catch (_) { }
    const baseName = path.basename(filePath, path.extname(filePath));
    const exeName = baseName + (language === 'c' ? '_c.exe' : '_cpp.exe');
    const outputExe = path.join(buildDir, exeName);

    sendTerminal({ type: 'system', text: `\x1b[90mCompiling...\x1b[0m\r\n` });
    const compilerCmd = toolPath; // resolved path to gcc/g++ or clang/clang++
    const compileArgs = [filePath, '-o', outputExe];
    // Use useShell: false for compilation as well to be safer with spaces
    const compileCode = await runProcess(compilerCmd, compileArgs, cwd, path.dirname(compilerCmd), false);

    if (compileCode !== 0) {
      sendTerminal({ type: 'error', text: `\x1b[31m✗ Compilation failed (exit ${compileCode})\x1b[0m\r\n` });
      sendTerminal({ type: 'stderr', text: `\x1b[90mHint:\x1b[0m Ensure compiler bin is in PATH: ${path.dirname(compilerCmd)}\r\n` });
      exitCode = compileCode;
    } else {
        sendTerminal({ type: 'system', text: `\x1b[32m✓ Compiled successfully\x1b[0m\r\n` });
        sendTerminal({ type: 'system', text: `\x1b[90mRunning ${path.relative(cwd, outputExe)}\x1b[0m\r\n` });
        // When running compiled binary, use direct execution (useShell = false) for better interactive input
        exitCode = await runProcess(outputExe, [], cwd, path.dirname(compilerCmd), false);
      }

  } else if (language === 'java') {

    const className = path.basename(filePath, '.java');
    const sourceDir = path.dirname(filePath);

    sendTerminal({ type: 'system', text: `\x1b[90mCompiling...\x1b[0m\r\n` });

    // Try to resolve javac path
    const javacPath = await resolveExecutable('javac', []);
    const javaPath = await resolveExecutable('java', []);

    const compileCode = await runProcess(javacPath || 'javac', [filePath], sourceDir, null, !javacPath);

    if (compileCode !== 0) {
      sendTerminal({ type: 'error', text: `\x1b[31m✗ Compilation failed (exit ${compileCode})\x1b[0m\r\n` });
      exitCode = compileCode;

    } else {

      sendTerminal({ type: 'system', text: `\x1b[32m✓ Compiled successfully\x1b[0m\r\n` });

      sendTerminal({ type: 'system', text: `\x1b[90mRunning ${className}\x1b[0m\r\n` });

      exitCode = await runProcess(
        javaPath || 'java',
        ['-cp', sourceDir, className],
        sourceDir,
        null,
        !javaPath
      );

    }
  }

  // Footer
  const finishColor = exitCode === 0 ? '\x1b[32m' : '\x1b[31m';
  const finishIcon = exitCode === 0 ? '✓' : '✗';
  sendTerminal({
    type: 'done',
    exitCode,
    text: `\r\n${finishColor}${finishIcon} Finished — Exit Code: ${exitCode}\x1b[0m\r\n`,
  });
});

// ─────────────────────────────────────────────
// IPC: Version Info
// ─────────────────────────────────────────────

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});
