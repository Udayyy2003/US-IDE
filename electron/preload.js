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
  createFile: (workspaceRoot, filePath) => ipcRenderer.invoke('create-file', workspaceRoot, filePath),
  createFolder: (workspaceRoot, dirPath) => ipcRenderer.invoke('create-folder', workspaceRoot, dirPath),
  renameFile: (root, target, newName) => ipcRenderer.invoke('rename-file', root, target, newName),
  deleteFile: (root, target) => ipcRenderer.invoke('delete-file', root, target),
  readDir: (dirPath) => ipcRenderer.invoke('read-dir', dirPath),

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

  // ─── Code Execution ──────────────────────────
  executeCode: (args) => ipcRenderer.invoke('execute-code', args),
  sendTerminalInput: (data) => ipcRenderer.invoke('terminal-input', data),

  // ─── Terminal Output Listener ─────────────────
  onTerminalOutput: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('terminal-output', handler);
    return () => ipcRenderer.removeListener('terminal-output', handler);
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
};

contextBridge.exposeInMainWorld('api', api);
