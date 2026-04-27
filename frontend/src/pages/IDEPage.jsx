import React, { useState, useCallback, useEffect } from 'react'
import { useIDE } from '../contexts/IDEContext'
import { useFiles } from '../contexts/FileContext'
import { useTabs } from '../contexts/TabContext'
import { useEditor } from '../contexts/EditorContext'
import * as apiUtils from '../utils/api'

import TopBar from '../components/TopBar'
import TabBar from '../components/TabBar'
import FileExplorer from '../components/FileExplorer'
import CodeEditor from '../components/CodeEditor'
import PDFViewer from '../components/PDFViewer'
import Terminal from '../components/Terminal'
import AIChatPanel from '../components/AIChatPanel'
import NewFileFolderModal from '../components/NewFileFolderModal'
import VoiceSearch from '../components/VoiceSearch'
import FileSearchModal from '../components/FileSearchModal'
import CommandPalette from '../components/CommandPalette'
import NewProjectModal from '../components/NewProjectModal'
import ProjectSelector from '../components/ProjectSelector'
import WelcomeDashboard from '../components/WelcomeDashboard'
import SaveFileModal from '../components/SaveFileModal'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import CustomizePanel from '../components/CustomizePanel'

const MIN_SIDEBAR = 160
const MAX_SIDEBAR = 420
const MIN_CHAT = 220
const MAX_CHAT = 520
const MIN_TERMINAL = 80
const MAX_TERMINAL = 600

export default function IDEPage() {
  const {
    terminalVisible, setTerminalVisible,
    terminals, activeTerminalId, createTerminal, killTerminal, toggleTerminal, renameTerminal, updateTerminalStyle,
    isTerminalMaximized, setIsTerminalMaximized,
    commandPaletteOpen, setCommandPaletteOpen,
    voiceSearchOpen, setVoiceSearchOpen,
    newFileFolderModal, setNewFileFolderModal,
    confirmNewFileFolder,
    openNewFileModal,
    aiPanelVisible, setAiPanelVisible
  } = useIDE()

  const {
    currentProject, openProject,
    workspaceRoot, fileTree,
    loadFiles
  } = useFiles()

  const {
    tabs, activeTabIndex, openTab, closeTab, closeAllTabs, setActiveTabIndex
  } = useTabs()

  const {
    currentFile, currentLanguage, editorContent, handleEditorChange,
    markSaved, isSaving, setIsSaving,
    autoSave, setAutoSave,
    handleEditorChange: onEditorChange // Avoid naming conflict if needed
  } = useEditor()

  const { user, logout, handleGoogleLogin: syncAuth } = useAuth()
  const { settings, isCustomizePanelOpen } = useSettings()

  const [showNewProject, setShowNewProject] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(220)
  const [chatWidth, setChatWidth] = useState(300)
  const [terminalHeight, setTerminalHeight] = useState(220)
  const [prevTerminalHeight, setPrevTerminalHeight] = useState(220)
  const [voiceSearchActive, setVoiceSearchActive] = useState(true)
  const [saveConfirmation, setSaveConfirmation] = useState({ isOpen: false, tabIndex: -1 })
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState(null)
  
  // Use environment variable or paste your client ID below directly
  const [googleClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || "544220144669-dm29cjddvbb0e3tgh0gom57me9rha79b.apps.googleusercontent.com")

  // 1. Auto login on reload: 
  useEffect(() => {
    if (user) {
      setAiPanelVisible(true);
    }
  }, [user, setAiPanelVisible]);

  // 2. Handle login with backend:
  const handleGoogleLogin = async (code) => {
    try {
      setIsLoggingIn(true);
      const apiUrl = import.meta.env.VITE_API_URL || "https://us-ide-backend.onrender.com";
      const res = await fetch(`${apiUrl}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown server error" }));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.user) {
        syncAuth(data.user);
        setIsLoggingIn(false);
        setAiPanelVisible(true);
        setShowLoginModal(false);
      } else {
        setLoginError("Authentication failed: No user data returned.");
      }
    } catch (err) {
      console.error("Backend Auth Error:", err);
      const errorMsg = err.message.includes("Failed to fetch") 
        ? "Server connection failed. Ensure the backend is running on Render." 
        : err.message;
      setLoginError(errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 3. Initialize OAuth client: 
  const handleGoogleLoginAction = useCallback(() => {
    if (!window.google || !googleClientId) {
      setLoginError("Google Auth not ready. Please refresh.");
      return;
    }

    setLoginError(null);

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: googleClientId,
      scope: "openid profile email",
      ux_mode: "popup",
      select_account: true, // Forces account chooser
      callback: async (response) => {
        if (response.error) {
          console.error("Login error:", response.error);
          setLoginError("Login failed. Please try again.");
          return;
        }
        // Send authorization code to backend
        await handleGoogleLogin(response.code);
      }
    });

    client.requestCode();
  }, [googleClientId, setAiPanelVisible]);

  // 4. Logout: 
  const handleLogout = useCallback(() => {
    logout();
    setAiPanelVisible(false);
  }, [logout, setAiPanelVisible]);

  const handleMicClick = () => {
    setVoiceSearchActive(true)
    setVoiceSearchOpen(true)
  }

  // ─── Save ────────────────────────────────────
  const handleSave = useCallback(async (tabIndex = activeTabIndex) => {
    const tab = tabs[tabIndex]
    if (!tab || !tab.unsaved) return
    setIsSaving(true)
    try {
      if (window.api) {
        await window.api.saveFile(workspaceRoot, tab.path, tab.content)
      } else {
        await apiUtils.saveFile(tab.path, tab.content)
      }
      markSaved(tabIndex)
    } catch (e) {
      console.error('[Save]', e)
    } finally {
      setIsSaving(false)
    }
  }, [activeTabIndex, tabs, workspaceRoot, setIsSaving, markSaved])

  const handleCloseTab = useCallback((index) => {
    const tab = tabs[index]
    if (tab && tab.unsaved) {
      setSaveConfirmation({ isOpen: true, tabIndex: index })
    } else {
      closeTab(index)
    }
  }, [tabs, closeTab])

  const handleCloseAllTabs = useCallback(() => {
    const hasUnsaved = tabs.some(t => t.unsaved)
    if (hasUnsaved) {
      const confirm = window.confirm("You have unsaved changes in some files. Are you sure you want to close everything?")
      if (!confirm) return
    }
    closeAllTabs()
  }, [tabs, closeAllTabs])

  const handleConfirmSave = async () => {
    const index = saveConfirmation.tabIndex
    await handleSave(index)
    closeTab(index)
    setSaveConfirmation({ isOpen: false, tabIndex: -1 })
  }

  const handleConfirmDontSave = () => {
    closeTab(saveConfirmation.tabIndex)
    setSaveConfirmation({ isOpen: false, tabIndex: -1 })
  }

  const handleConfirmCancel = () => {
    setSaveConfirmation({ isOpen: false, tabIndex: -1 })
  }

  // Listen for trigger-login event
  useEffect(() => {
    const handler = () => setShowLoginModal(true);
    window.addEventListener('trigger-login', handler);
    return () => window.removeEventListener('trigger-login', handler);
  }, []);

  // 5. Deep Link Listener for Auth
  useEffect(() => {
    if (window.api && window.api.onAuthSuccess) {
      const cleanup = window.api.onAuthSuccess((data) => {
        if (data.user) {
          syncAuth(data.user);
          setAiPanelVisible(true);
          setShowLoginModal(false);
          // Optional: localStorage.setItem("uside_token", data.token);
        }
      });
      return cleanup;
    }
  }, [syncAuth, setAiPanelVisible]);

  // Handle Web Login (Browser Redirect)
  const handleWebLogin = useCallback(() => {
    try {
      // Use production URL for login
      const loginUrl = "https://us-ide.vercel.app/us-login";
      console.log("[Auth] Attempting web login:", loginUrl);
      
      const hasApi = typeof window !== 'undefined' && window.api;
      const hasOpenExternal = hasApi && typeof window.api.openExternal === 'function';

      if (hasOpenExternal) {
        console.log("[Auth] Using Electron openExternal");
        window.api.openExternal(loginUrl);
      } else {
        console.log("[Auth] Using window.open fallback");
        window.open(loginUrl, "_blank");
      }
    } catch (e) {
      console.error("[Auth] handleWebLogin failed:", e);
      // Last resort fallback
      window.open("https://us-ide.vercel.app/us-login", "_blank");
    }
  }, []);

  useEffect(() => {
    // We no longer initialize ID client here as we use Code Flow
  }, []);

  const handleMaximizeTerminal = useCallback(() => {
    setPrevTerminalHeight(terminalHeight);
    setIsTerminalMaximized(true);
  }, [terminalHeight, setIsTerminalMaximized]);

  const handleRestoreTerminal = useCallback(() => {
    setIsTerminalMaximized(false);
    setTerminalHeight(prevTerminalHeight);
  }, [prevTerminalHeight, setIsTerminalMaximized]);

  const handleSaveAll = useCallback(async () => {
    const toSave = tabs.filter(t => t.unsaved)
    if (toSave.length === 0) return
    setIsSaving(true)
    try {
      for (const [i, tab] of tabs.entries()) {
        if (tab.unsaved) {
          if (window.api) {
            await window.api.saveFile(workspaceRoot, tab.path, tab.content)
          } else {
            await apiUtils.saveFile(tab.path, tab.content)
          }
          markSaved(i)
        }
      }
    } catch (e) {
      console.error('[Save All]', e)
    } finally {
      setIsSaving(false)
    }
  }, [tabs, workspaceRoot, setIsSaving, markSaved])

  // ─── Run ─────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (!currentFile) return;
    if (!window.api?.writeTerminal) {
      alert("Execution is only available in the desktop app.");
      return;
    }

    setTerminalVisible(true);
    
    let targetId = activeTerminalId;
    if (!targetId || terminals.length === 0) {
      // Create a new terminal if none exists
      try {
        let fileDir = workspaceRoot || currentProject?.path;
        if (currentFile) {
          const parts = currentFile.split(/[\\\/]/);
          parts.pop();
          fileDir = parts.join('\\');
        }
        
        const id = await createTerminal('Terminal', fileDir);
        if (id) {
          targetId = id;
          await new Promise(r => setTimeout(r, 400));
        } else {
          return;
        }
      } catch (err) {
        console.error('[Terminal Create Error in Run]', err);
        return;
      }
    }

    console.log("Running in terminal:", targetId);

    const filePath = currentFile;
    let runCmd = '';

    switch (currentLanguage) {
      case 'py':
      case 'python':
        const pyFileNameOnly = filePath.split(/[\\\/]/).pop();
        const pyLastSlash = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
        const pyFileDir = pyLastSlash !== -1 ? filePath.substring(0, pyLastSlash).replace(/[\\\/]+$/, '') : '.';
        runCmd = `cd "${pyFileDir}"; python -u "${pyFileNameOnly}"`;
        break;
      case 'javascript':
        const jsFileNameOnly = filePath.split(/[\\\/]/).pop();
        const jsLastSlash = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
        const jsFileDir = jsLastSlash !== -1 ? filePath.substring(0, jsLastSlash).replace(/[\\\/]+$/, '') : '.';
        runCmd = `cd "${jsFileDir}"; node "${jsFileNameOnly}"`;
        break;
      case 'c':
      case 'cpp':
      case 'java':
        // For compiled languages, we still use the smart multi-command
        const fileNameOnly = filePath.split(/[\\\/]/).pop();
        const baseName = fileNameOnly.substring(0, fileNameOnly.lastIndexOf('.'));
        const lastSlash = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
        const fileDir = lastSlash !== -1 ? filePath.substring(0, lastSlash).replace(/[\\\/]+$/, '') : '.';
        const buildDir = `${fileDir}\\build`;
        
        if (currentLanguage === 'c') {
          const out = `${buildDir}\\${baseName}_c.exe`;
          runCmd = `if (!(Test-Path "${buildDir}")) { mkdir "${buildDir}" | Out-Null }; gcc "${filePath}" -o "${out}"; if ($?) { & "${out}" }`;
        } else if (currentLanguage === 'cpp') {
          const out = `${buildDir}\\${baseName}_cpp.exe`;
          runCmd = `if (!(Test-Path "${buildDir}")) { mkdir "${buildDir}" | Out-Null }; g++ "${filePath}" -o "${out}"; if ($?) { & "${out}" }`;
        } else {
          // Optimized Structured Java execution:
          // 1. Compile directly into its own directory.
          // 2. Run with its folder as the classpath.
          // This ensures .class files stay with their .java source.
          runCmd = `javac -d "${fileDir}" "${filePath}"; java -cp "${fileDir}" "${baseName}"`;
        }
        break;
      default:
        alert(`Run not configured for ${currentLanguage}`);
        return;
    }

    if (runCmd && targetId) {
      // Robust reset: Send Ctrl+C, wait, then the command.
      // This prevents PowerShell from entering a waiting (>>) state.
      window.api.writeTerminal(targetId, `\x03`);
      setTimeout(() => {
        // We use \r to simulate Enter key for maximum shell compatibility
        window.api.writeTerminal(targetId, `${runCmd}\r`);
      }, 200); // Increased delay for stability
    }
  }, [currentFile, currentLanguage, workspaceRoot, currentProject, activeTerminalId, terminals.length, setTerminalVisible, createTerminal]);

  // ─── Open File ───────────────────────────────
  const handleOpenFile = useCallback(async () => {
    const res = await window.api.openFile()
    if (!res?.path) return
    const name = res.path.split(/[\\/]/).pop()
    const ext = name.split('.').pop().toLowerCase()
    const langMap = { py: 'python', c: 'c', cpp: 'cpp', java: 'java', js: 'javascript', ts: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown' }
    const language = langMap[ext] || 'plaintext'
    openTab({ path: res.path, name, content: res.content, language })
  }, [openTab])

  // ─── Open Folder ─────────────────────────────
  const handleOpenFolder = useCallback(async () => {
    const folder = await window.api.openFolder()
    if (!folder) return
    const name = folder.split(/[\\/]/).pop()
    openProject({ name, path: folder })
  }, [openProject])

  // ─── New File / Folder ──────────────────────
  const handleNewFile = useCallback((initialPath = currentProject?.path) => {
    if (!currentProject?.path) return
    if (!(typeof window !== 'undefined' && window.api)) { alert('Use the Electron app to create files (npm run dev).'); return }
    setNewFileFolderModal({ isOpen: true, type: 'file', initialPath, initialName: '' })
  }, [currentProject?.path, setNewFileFolderModal])

  const handleNewFolder = useCallback((initialPath = currentProject?.path) => {
    if (!currentProject?.path) return
    if (!(typeof window !== 'undefined' && window.api)) { alert('Use the Electron app to create folders (npm run dev).'); return }
    setNewFileFolderModal({ isOpen: true, type: 'folder', initialPath, initialName: '' })
  }, [currentProject?.path, setNewFileFolderModal])

  // ─── Open pending file from WelcomeScreen ────
  useEffect(() => {
    if (window.__pendingOpenFile) {
      openTab(window.__pendingOpenFile)
      window.__pendingOpenFile = null
    }
  }, [openTab])

  // ─── Menu Events from Electron ───────────────
  useEffect(() => {
    if (!window.api?.onMenuEvent) return
    const cleanup = window.api.onMenuEvent((event) => {
      switch (event) {
        case 'menu-open-file': handleOpenFile(); break
        case 'menu-open-folder': handleOpenFolder(); break
        case 'menu-new-file': handleNewFile(); break
        case 'menu-new-folder': handleNewFolder(); break
        case 'menu-save': handleSave(); break
        case 'menu-run': handleRun(); break
        case 'menu-command-palette': setCommandPaletteOpen(true); break
      }
    })
    return cleanup
  }, [currentFile, editorContent, handleSave, handleRun, handleOpenFile, handleOpenFolder, handleNewFile, setCommandPaletteOpen])

  // ─── Keyboard Shortcuts ──────────────────────
  useEffect(() => {
    let sequence = []

    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl + K + W (sequence detection)
      if (ctrl && e.key.toLowerCase() === 'k') {
        sequence = ['k']
        return
      }

      if (sequence[0] === 'k' && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        handleCloseAllTabs()
        sequence = []
        return
      }

      // Reset sequence on any other key
      if (e.key !== 'Control' && e.key !== 'Meta') {
        sequence = []
      }

      // Ctrl + W → Close active tab
      if (ctrl && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        if (activeTabIndex !== -1) {
          handleCloseTab(activeTabIndex)
        }
      }

      // Ctrl + N → New file modal
      if (ctrl && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        openNewFileModal({ type: 'file' })
      }

      // Ctrl + S → Save
      if (ctrl && e.key === 's') {
        e.preventDefault()
        handleSave()
      }

      // Ctrl + Shift + S → Save all files
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSaveAll()
      }

      // Ctrl + Tab → Switch to next tab
      if (ctrl && e.key === 'Tab') {
        e.preventDefault()
        if (tabs.length > 0) {
          setActiveTabIndex(prev => (prev + 1) % tabs.length)
        }
      }

      if (ctrl && e.key === 'Enter') {
        e.preventDefault()
        handleRun()
      }

      if (ctrl && e.key === 'o') {
        e.preventDefault()
        handleOpenFile()
      }

      // Ctrl + ` → Toggle terminal
      if (ctrl && e.key === '`') {
        e.preventDefault()
        toggleTerminal()
      }
    }
    window.addEventListener('keydown', handler)

    // Handle tab close events from other components
    const handleCloseTabEvent = (e) => {
      handleCloseTab(e.detail.index);
    };
    const handleCloseAllTabsEvent = () => {
      handleCloseAllTabs();
    };
    window.addEventListener('close-tab', handleCloseTabEvent);
    window.addEventListener('close-all-tabs', handleCloseAllTabsEvent);

    // Intercept window close/refresh if unsaved
    const beforeUnloadHandler = (e) => {
      const hasUnsaved = tabs.some(t => t.unsaved);
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('close-tab', handleCloseTabEvent)
      window.removeEventListener('close-all-tabs', handleCloseAllTabsEvent)
      window.removeEventListener('beforeunload', beforeUnloadHandler)
    }
  }, [tabs, activeTabIndex, handleCloseTab, handleCloseAllTabs, openNewFileModal, handleSave, handleSaveAll, handleRun, handleOpenFile, setTerminalVisible, closeAllTabs, setActiveTabIndex])

  // ─── Panel Resize Helpers ────────────────────
  const makeHorizResizer = (setter, startValRef, minVal, maxVal, direction = 1) =>
    (e) => {
      e.preventDefault()
      const startX = e.clientX
      const startW = startValRef
      const onMove = (ev) => {
        const delta = (ev.clientX - startX) * direction
        setter(Math.max(minVal, Math.min(maxVal, startW + delta)))
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }

  const makeVertResizer = (setter, startValRef, minVal, maxVal) =>
    (e) => {
      e.preventDefault()
      const startY = e.clientY
      const startH = startValRef
      const onMove = (ev) => {
        const delta = startY - ev.clientY
        setter(Math.max(minVal, Math.min(maxVal, startH + delta)))
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }

  const showExplorer = settings.layout !== 'minimal' && settings.layout !== 'focus' && settings.layout !== 'ai-first';
  const showAI = (aiPanelVisible && user) || settings.layout === 'ai-first';
  const aiWidth = settings.layout === 'ai-first' ? '50%' : 'min(400px, 100%)';

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      overflow: 'hidden', 
      background: '#0a0a0f',
      filter: settings.theme === 'light' ? 'invert(1) hue-rotate(180deg)' : 'none' // Basic live preview for Light theme
    }}>
      {/* Top Bar */}
      <TopBar
        onSave={handleSave}
        onSaveAll={handleSaveAll}
        onRun={handleRun}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onNewFile={handleNewFile}
        onNewProject={() => setShowNewProject(true)}
        onToggleTerminal={toggleTerminal}
        onCommandPalette={() => setCommandPaletteOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ─ Left: File Explorer ─ */}
        {showExplorer && (
          <>
            <div style={{ width: sidebarWidth, flexShrink: 0, overflow: 'hidden', borderRight: '1px solid #1f1f2e' }}>
              <FileExplorer />
            </div>

            {/* Sidebar resize handle */}
            <div
              onMouseDown={makeHorizResizer(setSidebarWidth, sidebarWidth, MIN_SIDEBAR, MAX_SIDEBAR)}
              style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: '#1f1f2e', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#7c6df5'}
              onMouseLeave={e => e.currentTarget.style.background = '#1f1f2e'}
            />
          </>
        )}

        {/* ─ Center: Editor + Terminal ─ */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* File tabs */}
          {!isTerminalMaximized && settings.layout !== 'focus' && <TabBar />}

          {/* Editor */}
          {!isTerminalMaximized && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {tabs && tabs.length > 0 ? (
                tabs[activeTabIndex]?.type === 'pdf' ? (
                  <PDFViewer 
                    path={tabs[activeTabIndex].path} 
                    title={tabs[activeTabIndex].name} 
                  />
                ) : (
                  <CodeEditor
                    language={currentLanguage}
                    value={editorContent}
                    onChange={handleEditorChange}
                    onSave={handleSave}
                  />
                )
              ) : (
                <WelcomeDashboard setShowLoginModal={setShowLoginModal} />
              )}
            </div>
          )}

          {/* Terminal resize handle */}
          {terminalVisible && !isTerminalMaximized && settings.layout !== 'focus' && (
            <div
              onMouseDown={makeVertResizer(setTerminalHeight, terminalHeight, MIN_TERMINAL, MAX_TERMINAL)}
              style={{ height: 4, flexShrink: 0, cursor: 'row-resize', background: '#1f1f2e', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#7c6df5'}
              onMouseLeave={e => e.currentTarget.style.background = '#1f1f2e'}
            />
          )}

          {/* Terminal */}
          {terminalVisible && settings.layout !== 'focus' && (
            <div style={{ 
              height: isTerminalMaximized ? '100%' : terminalHeight, 
              flexShrink: 0, 
              borderTop: isTerminalMaximized ? 'none' : '1px solid #1f1f2e', 
              overflow: 'hidden',
              flex: isTerminalMaximized ? 1 : 'none'
            }}>
              <Terminal 
                terminalHeight={isTerminalMaximized ? window.innerHeight : terminalHeight} 
                onMaximize={handleMaximizeTerminal} 
                onRestore={handleRestoreTerminal}
              />
            </div>
          )}
        </div>

        {/* Chat resize handle */}
        {showAI && settings.layout !== 'focus' && (
          <div
            onMouseDown={makeHorizResizer(setChatWidth, chatWidth, MIN_CHAT, MAX_CHAT, -1)}
            style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: '#1f1f2e', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#7c6df5'}
            onMouseLeave={e => e.currentTarget.style.background = '#1f1f2e'}
          />
        )}

        {/* ─ Right: AI Chat ─ */}
        {showAI && settings.layout !== 'focus' && (
          <div style={{
            width: aiWidth,
            minWidth: settings.layout === 'ai-first' ? '40%' : '300px',
            zIndex: 100,
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '-5px 0 15px rgba(0,0,0,0.2)',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            <AIChatPanel />
          </div>
        )}

        {/* ─ Right Floating: Customize Panel ─ */}
        {isCustomizePanelOpen && (
          <div style={{
            position: 'absolute',
            top: 56, // TopBar height
            bottom: 22, // StatusBar height
            right: 0,
            width: '350px',
            zIndex: 1000,
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            animation: 'slideInRight 0.3s ease-out'
          }}>
            <CustomizePanel />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 22, background: '#0d0d18',
        borderTop: '1px solid #1f1f2e', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, fontFamily: 'monospace', color: '#555570' }}>
          {currentProject && <span>{currentProject.name}</span>}
          {currentLanguage && <span style={{ color: '#7c6df5' }}>{currentLanguage.toUpperCase()}</span>}
          {currentFile && <span style={{ opacity: 0.6, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentFile}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, fontFamily: 'monospace', color: '#555570' }}>
          <span style={{ color: autoSave ? '#00ff94' : '#555570' }}>
            {autoSave ? '⚡ Auto Save ON' : 'Auto Save OFF'}
          </span>
          <span>US-IDE v1.0</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff94' }} />
        </div>
      </div>

      {/* Modals */}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onProjectCreated={() => setShowNewProject(false)}
        />
      )}

      {commandPaletteOpen && (
        <CommandPalette
          onClose={() => setCommandPaletteOpen(false)}
          onSave={handleSave}
          onRun={handleRun}
          onOpenFile={handleOpenFile}
          onOpenFolder={handleOpenFolder}
          onNewFile={handleNewFile}
          onToggleTerminal={() => setTerminalVisible(v => !v)}
        />
      )}
      {voiceSearchOpen && voiceSearchActive && VoiceSearch ? (
        <VoiceSearch fileTree={fileTree} onFallback={() => setVoiceSearchActive(false)} />
      ) : null}
      {voiceSearchOpen && !voiceSearchActive && FileSearchModal ? (
        <FileSearchModal />
      ) : null}

      <NewFileFolderModal
        isOpen={newFileFolderModal.isOpen}
        onClose={() => setNewFileFolderModal({ ...newFileFolderModal, isOpen: false })}
        onConfirm={confirmNewFileFolder}
        initialName={newFileFolderModal.initialName}
        initialPath={newFileFolderModal.initialPath}
        type={newFileFolderModal.type}
      />

      {saveConfirmation.isOpen && (
        <SaveFileModal
          fileName={tabs[saveConfirmation.tabIndex]?.name}
          onSave={handleConfirmSave}
          onDontSave={handleConfirmDontSave}
          onCancel={handleConfirmCancel}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 20000,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: '#13131e', padding: '40px', borderRadius: '24px',
            border: '1px solid #2a2a3d', width: '400px', textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🤖</div>
            <h2 style={{ color: '#fff', marginBottom: '8px', fontSize: '24px', fontWeight: 700 }}>Meet US Assistant</h2>
            <p style={{ color: '#8888a0', marginBottom: '32px', fontSize: '15px', lineHeight: '1.5' }}>
              Your AI pair programmer is ready. <br/>
              Please sign in to continue.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
              {isLoggingIn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#7c6df5' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid rgba(124,109,245,0.2)', borderTopColor: '#7c6df5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>Signing in...</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    console.log("AI Click - Current user in state:", user);
                    // Force a check against localStorage to be absolutely sure
                    const hasUser = !!localStorage.getItem('uside_user');
                    
                    if (!hasUser) {
                      handleWebLogin();
                    }
                  }}
                  style={{
                    width: 320,
                    height: 50,
                    background: '#fff',
                    border: '1px solid #dadce0',
                    borderRadius: 25,
                    color: '#3c4043',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.15)'; e.currentTarget.style.background = '#f8f9fa' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; e.currentTarget.style.background = '#fff' }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184L12.048 13.558c-.411.275-.937.438-1.548.438-1.192 0-2.201-.806-2.561-1.89H4.978v2.342C6.459 17.398 8.169 18 9 18z" fill="#34A853"/>
                    <path d="M6.439 12.106c-.095-.285-.149-.589-.149-.906s.054-.621.149-.906V7.952H4.978C4.542 8.832 4.3 9.8 4.3 10.8s.242 1.968.678 2.848l1.461-1.542z" fill="#FBBC05"/>
                    <path d="M9 4.3c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.806 11.426 0 9 0 6.169 0 4.459.602 3.511 1.611l2.927 2.341C6.799 5.106 7.808 4.3 9 4.3z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              )}
              {loginError && <p style={{ color: '#ff4d6d', fontSize: '12px', marginTop: '12px' }}>{loginError}</p>}
            </div>
            
            <div style={{ margin: '24px 0', height: '1px', background: '#2a2a3d' }} />

            <button 
              onClick={() => setShowLoginModal(false)}
              disabled={isLoggingIn}
              style={{ background: 'none', border: 'none', color: isLoggingIn ? '#3a3a4d' : '#555570', cursor: isLoggingIn ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500 }}
            >
              Not now, maybe later
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
