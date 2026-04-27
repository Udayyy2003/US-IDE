/**
 * US-IDE — Electron Preload Script
 * Exposes safe IPC APIs to the renderer process via window.api
 */

const { contextBridge, ipcRenderer } = require('electron');

const api = {
  // ─── Workspace Persistence ───────────────────
  getWorkspace: () => ipcRenderer.invoke('get-workspace'),
  saveWorkspace: (data) => ipcRenderer.invoke('save-workspace', data),

  // ─── Folder / File Operations ────────────────
  openFolder: () => ipcRenderer.invoke('open-folder'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  openFile: (path) => ipcRenderer.invoke('open-file', path),
  saveFile: (workspaceRoot, filePath, content) => ipcRenderer.invoke('save-file', workspaceRoot, filePath, content),
  createFile: (workspaceRoot, filePath, content) => ipcRenderer.invoke('create-file', workspaceRoot, filePath, content),
  createFolder: (workspaceRoot, dirPath) => ipcRenderer.invoke('create-folder', workspaceRoot, dirPath),
  renameFile: (root, target, newName) => ipcRenderer.invoke('rename-file', root, target, newName),
  deleteFile: (root, target) => ipcRenderer.invoke('delete-file', root, target),
  readDir: (dirPath, recursive = false) => ipcRenderer.invoke('read-dir', dirPath, recursive),

  // ─── Project Creation ────────────────────────
  createProject: (folder, name, lang, file, content) =>
    ipcRenderer.invoke('create-project', folder, name, lang, file, content),

  // ─── File System Watching ────────────────────
  watchDir: (dirPath) => ipcRenderer.invoke('watch-dir', dirPath),
  unwatchDir: (dirPath) => ipcRenderer.invoke('unwatch-dir', dirPath),
  onDirChanged: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('dir-changed', handler);
    return () => ipcRenderer.removeListener('dir-changed', handler);
  },

  // ─── Multi-Terminal (node-pty) ───────────────
  createTerminal: (id, cwd) => ipcRenderer.invoke('terminal-create', id, cwd),
  writeTerminal: (id, data) => ipcRenderer.invoke('terminal-write', id, data),
  resizeTerminal: (id, cols, rows) => ipcRenderer.invoke('terminal-resize', id, { cols, rows }),
  killTerminal: (id) => ipcRenderer.invoke('terminal-kill', id),
  onTerminalData: (id, callback) => {
    const channel = `terminal-data-${id}`;
    const handler = (_event, data) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
  onTerminalExit: (id, callback) => {
    const channel = `terminal-exit-${id}`;
    const handler = (_event, exitData) => callback(exitData);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },

  // ─── Menu Events ─────────────────────────────
  onMenuEvent: (callback) => {
    const events = [
      'menu-open-file',
      'menu-open-folder',
      'menu-new-file',
      'menu-save',
      'menu-run',
      'menu-toggle-terminal',
      'menu-command-palette',
    ];
    const handlers = events.map(event => {
      const handler = () => callback(event);
      ipcRenderer.on(event, handler);
      return { event, handler };
    });
    // Return cleanup function
    return () => handlers.forEach(({ event, handler }) =>
      ipcRenderer.removeListener(event, handler)
    );
  },

  // ─── App Info ────────────────────────────────
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // ─── Window Management ───────────────────────
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),

  // ─── Authentication ──────────────────────────
  onAuthSuccess: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('auth-success', handler);
    return () => ipcRenderer.removeListener('auth-success', handler);
  },
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // ─── Clipboard ───────────────────────────────
  copyToClipboard: (text) => ipcRenderer.invoke('clipboard-copy', text),
};

contextBridge.exposeInMainWorld('api', api);
