import React, { createContext, useContext, useState, useCallback } from 'react';
import { useFiles } from './FileContext';
import { useTabs } from './TabContext';

const IDEContext = createContext(null);

export function IDEProvider({ children }) {
  const { currentProject, loadFiles, workspaceRoot, selectedFile, createFile, createFolder } = useFiles();
  const { openTab, tabs, activeTabIndex } = useTabs();

  // ─── Terminal ──────────────────────────────
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminals, setTerminals] = useState([]); // [{ id, title, cwd, color, icon }]
  const [activeTerminalId, setActiveTerminalId] = useState(null);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

  const createTerminal = useCallback(async (title, cwd) => {
    if (!window.api?.createTerminal) return;
    
    // Resolve cwd
    let finalCwd = cwd;
    if (!finalCwd) {
      const activeTab = tabs[activeTabIndex];
      if (activeTab && activeTab.path) {
        const parts = activeTab.path.split(/[\\\/]/);
        parts.pop();
        finalCwd = parts.join('\\');
      }
    }
    if (!finalCwd) finalCwd = workspaceRoot || currentProject?.path;

    // Default naming: Terminal 1, Terminal 2...
    let finalTitle = title;
    if (!finalTitle) {
      const count = terminals.length + 1;
      finalTitle = `Terminal ${count}`;
    }

    const id = `term-${Date.now()}`;
    try {
      const success = await window.api.createTerminal(id, finalCwd);
      if (success) {
        const newTerminal = { 
          id, 
          title: finalTitle, 
          cwd: finalCwd,
          icon: 'terminal' // Default icon
        };
        setTerminals(prev => [...prev, newTerminal]);
        setActiveTerminalId(id);
        setTerminalVisible(true);
        return id;
      }
    } catch (err) {
      console.error('[Terminal Create Error]', err);
    }
    return null;
  }, [workspaceRoot, currentProject, tabs, activeTabIndex, terminals]);

  const killTerminal = useCallback(async (id) => {
    if (!window.api?.killTerminal) return;
    await window.api.killTerminal(id);
    
    setTerminals(prev => {
      const filtered = prev.filter(t => t.id !== id);
      
      if (activeTerminalId === id && filtered.length > 0) {
        setActiveTerminalId(filtered[filtered.length - 1].id);
      } else if (filtered.length === 0) {
        setActiveTerminalId(null);
        setTerminalVisible(false);
      }
      return filtered;
    });
  }, [activeTerminalId]);

  const renameTerminal = useCallback((id, newTitle) => {
    if (!newTitle) return;
    setTerminals(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
  }, []);

  const updateTerminalStyle = useCallback((id, updates) => {
    setTerminals(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const toggleTerminal = useCallback(() => {
    setTerminalVisible(v => {
      const nextVisible = !v;
      if (nextVisible && terminals.length === 0) {
        createTerminal();
      }
      return nextVisible;
    });
  }, [terminals.length, createTerminal]);

  // Handle Menu Event: Toggle Terminal
  React.useEffect(() => {
    if (!window.api?.onMenuEvent) return;
    const cleanup = window.api.onMenuEvent((event) => {
      if (event === 'menu-toggle-terminal') {
        toggleTerminal();
      }
    });
    return cleanup;
  }, [toggleTerminal]);

  // ─── UI State ──────────────────────────────
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [voiceSearchOpen, setVoiceSearchOpen] = useState(false);
  const [aiPanelVisible, setAiPanelVisible] = useState(false);

  // ─── Modals ────────────────────────────────
  const [newFileFolderModal, setNewFileFolderModal] = useState({ 
    isOpen: false, 
    type: 'file', 
    initialPath: '', 
    initialName: '' 
  });

  const openNewFileModal = useCallback((options = { type: 'file' }) => {
    const parentPath = selectedFile?.isDirectory ? selectedFile.path : currentProject?.path || '';
    setNewFileFolderModal({ 
      isOpen: true, 
      type: options.type || 'file', 
      initialPath: parentPath, 
      initialName: '' 
    });
  }, [currentProject, selectedFile]);

  const confirmNewFileFolder = useCallback(async (name, path, type) => {
    if (!name || !path) return;

    let res;
    if (type === 'file') {
      // Corrected: name is fileName, "" is initial content, path is parentPath
      res = await createFile(name, "", path); 
      if (res.success) {
        const fullPath = path ? `${path}\\${name}` : name;
        const ext = name.split('.').pop().toLowerCase();
        const langMap = { 
          py: 'python', c: 'c', cpp: 'cpp', java: 'java', 
          js: 'javascript', ts: 'typescript', html: 'html', 
          css: 'css', json: 'json', md: 'markdown' 
        };
        openTab({ path: fullPath, name, content: '', language: langMap[ext] || 'plaintext' });
      }
    } else {
      res = await createFolder(name, path);
    }

    if (res.success) {
      setNewFileFolderModal({ isOpen: false, type: 'file', initialPath: '', initialName: '' });
    }
  }, [createFile, createFolder, openTab]);

  const duplicateTerminal = useCallback(async (terminal, initialContent = '') => {
    if (!terminal || !window.api?.createTerminal) return;
    
    const newTitle = `${terminal.title} (Copy)`;
    const id = `term-${Date.now()}`;
    
    try {
      const success = await window.api.createTerminal(id, terminal.cwd);
      if (success) {
        const newTerminal = { 
          id, 
          title: newTitle, 
          cwd: terminal.cwd,
          icon: terminal.icon || 'terminal',
          initialContent // Store initial content to be written on load
        };
        setTerminals(prev => [...prev, newTerminal]);
        setActiveTerminalId(id);
        setTerminalVisible(true);
        return id;
      }
    } catch (err) {
      console.error('[Terminal Duplicate Error]', err);
    }
    return null;
  }, []);

  return (
    <IDEContext.Provider value={{
      // Terminal
      terminalVisible, setTerminalVisible,
      terminals, setTerminals,
      activeTerminalId, setActiveTerminalId,
      isTerminalMaximized, setIsTerminalMaximized,
      createTerminal, killTerminal, toggleTerminal, renameTerminal, updateTerminalStyle, duplicateTerminal,

      // UI
      commandPaletteOpen, setCommandPaletteOpen,
      voiceSearchOpen, setVoiceSearchOpen,
      aiPanelVisible, setAiPanelVisible,

      // Modals
      newFileFolderModal, setNewFileFolderModal,
      confirmNewFileFolder,
      openNewFileModal
    }}>
      {children}
      {/* Toast Notification Container (Global) */}
      <div id="ide-toast-container" style={{
        position: 'fixed',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10001,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center'
      }}></div>
    </IDEContext.Provider>
  );
}

// Helper to show a simple toast
export const showToast = (message, type = 'info') => {
  const container = document.getElementById('ide-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'danger' ? '#ff4d6d' : '#1a1a28'};
    color: #e8e8f0;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid ${type === 'danger' ? '#ff4d6d' : '#7c6df5'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-size: 12px;
    font-weight: 600;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: auto;
  `;
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  // Remove after 3s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => container.removeChild(toast), 300);
  }, 3000);
};

export const useIDE = () => useContext(IDEContext);
