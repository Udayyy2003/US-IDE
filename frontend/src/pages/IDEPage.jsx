import React, { useState, useCallback, useEffect } from 'react'
import { useIDE } from '../contexts/IDEContext'

import TopBar from '../components/TopBar'
import FileTabs from '../components/FileTabs'
import FileExplorer from '../components/FileExplorer'
import CodeEditor from '../components/CodeEditor'
import Terminal from '../components/Terminal'
import AIChatPanel from '../components/AIChatPanel'
import NewProjectModal from '../components/NewProjectModal'
import CommandPalette from '../components/CommandPalette'

const MIN_SIDEBAR = 160
const MAX_SIDEBAR = 420
const MIN_CHAT = 220
const MAX_CHAT = 520
const MIN_TERMINAL = 80
const MAX_TERMINAL = 600

export default function IDEPage() {
  const {
    currentProject, currentFile, currentLanguage,
    editorContent,
    setCurrentFile, setCurrentLanguage, setEditorContent, setCurrentProject,
    openFileInTab, markSaved, setIsSaving, openProject,
    isRunning, setIsRunning,
    terminalVisible, setTerminalVisible,
    commandPaletteOpen, setCommandPaletteOpen,
    autoSave, setAutoSave,
    workspaceRoot,
  } = useIDE()

  const [showNewProject, setShowNewProject] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(220)
  const [chatWidth, setChatWidth] = useState(300)
  const [terminalHeight, setTerminalHeight] = useState(220)
  const [newFileDlg, setNewFileDlg] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  // ─── Open pending file from WelcomeScreen ────
  useEffect(() => {
    if (window.__pendingOpenFile) {
      openFileInTab(window.__pendingOpenFile)
      window.__pendingOpenFile = null
    }
  }, [openFileInTab])

  // ─── Menu Events from Electron ───────────────
  useEffect(() => {
    if (!window.api?.onMenuEvent) return
    const cleanup = window.api.onMenuEvent((event) => {
      switch (event) {
        case 'menu-open-file': handleOpenFile(); break
        case 'menu-open-folder': handleOpenFolder(); break
        case 'menu-new-file': handleNewFile(); break
        case 'menu-save': handleSave(); break
        case 'menu-run': handleRun(); break
        case 'menu-toggle-terminal': setTerminalVisible(v => !v); break
        case 'menu-command-palette': setCommandPaletteOpen(true); break
      }
    })
    return cleanup
  }, [currentFile, editorContent, isRunning])

  // ─── Keyboard Shortcuts ──────────────────────
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === 's') {
        e.preventDefault(); handleSave(); return
      }
      if (ctrl && e.key === 'Enter') {
        e.preventDefault(); handleRun(); return
      }
      if (ctrl && e.key === 'o') {
        e.preventDefault(); handleOpenFile(); return
      }
      if (ctrl && (e.key === 'O' || (e.shiftKey && e.key.toLowerCase() === 'o'))) {
        e.preventDefault(); handleOpenFolder(); return
      }
      if (ctrl && e.key === 'n') {
        e.preventDefault(); handleNewFile(); return
      }
      if (ctrl && e.key === '`') {
        e.preventDefault(); setTerminalVisible(v => !v); return
      }
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault(); setCommandPaletteOpen(true); return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentFile, editorContent, isRunning, terminalVisible])

  // ─── Save ────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!currentFile) return
    setIsSaving(true)
    try {
      await window.api.saveFile(workspaceRoot, currentFile, editorContent)
      markSaved(currentFile)
    } catch (e) {
      console.error('[Save]', e)
    } finally {
      setIsSaving(false)
    }
  }, [currentFile, editorContent, setIsSaving, markSaved, workspaceRoot])

  // ─── Run ─────────────────────────────────────
  const handleRun = useCallback(() => {
    if (!currentFile || isRunning) return
    setIsRunning(true)
    setTerminalVisible(true)
  }, [currentFile, isRunning, setIsRunning, setTerminalVisible])

  // ─── Open File ───────────────────────────────
  const handleOpenFile = useCallback(async () => {
    const res = await window.api.openFile()
    if (!res?.path) return
    const name = res.path.split(/[\\/]/).pop()
    const ext = name.split('.').pop().toLowerCase()
    const langMap = { py: 'python', c: 'c', cpp: 'cpp', java: 'java', js: 'javascript', ts: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown' }
    const language = langMap[ext] || 'plaintext'
    openFileInTab({ path: res.path, name, content: res.content, language })
  }, [openFileInTab])

  // ─── Open Folder ─────────────────────────────
  const handleOpenFolder = useCallback(async () => {
    const folder = await window.api.openFolder()
    if (!folder) return
    const name = folder.split(/[\\/]/).pop()
    openProject({ name, path: folder })
  }, [openProject])

  // ─── New File ────────────────────────────────
  const handleNewFile = useCallback(async () => {
    if (!currentProject?.path) return
    if (!(typeof window !== 'undefined' && window.api)) { alert('Use the Electron app to create files (npm run dev).'); return }
    setNewFileName('')
    setNewFileDlg(true)
  }, [currentProject])

  const confirmNewFile = useCallback(async () => {
    const name = newFileName.trim()
    if (!name || /[\\/]|^\.+$|\.{2}/.test(name)) return
    const fullPath = `${currentProject.path}\\${name}`
    const res = await window.api.createFile(workspaceRoot || currentProject.path, fullPath)
    if (res.success) {
      const ext = name.split('.').pop().toLowerCase()
      const langMap = { py: 'python', c: 'c', cpp: 'cpp', java: 'java', js: 'javascript', ts: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown' }
      openFileInTab({ path: fullPath, name, content: '', language: langMap[ext] || 'plaintext' })
    }
    setNewFileDlg(false)
  }, [newFileName, currentProject, openFileInTab, workspaceRoot])

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#0a0a0f' }}>
      {/* Top Bar */}
      <TopBar
        onSave={handleSave}
        onRun={handleRun}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onNewFile={handleNewFile}
        onNewProject={() => setShowNewProject(true)}
        onToggleTerminal={() => setTerminalVisible(v => !v)}
        onCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Main 3-column area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ─ Left: File Explorer ─ */}
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

        {/* ─ Center: Editor + Terminal ─ */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* File tabs */}
          <FileTabs />

          {/* Editor */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeEditor onSave={handleSave} />
          </div>

          {/* Terminal resize handle */}
          {terminalVisible && (
            <div
              onMouseDown={makeVertResizer(setTerminalHeight, terminalHeight, MIN_TERMINAL, MAX_TERMINAL)}
              style={{ height: 4, flexShrink: 0, cursor: 'row-resize', background: '#1f1f2e', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#7c6df5'}
              onMouseLeave={e => e.currentTarget.style.background = '#1f1f2e'}
            />
          )}

          {/* Terminal */}
          {terminalVisible && (
            <div style={{ height: terminalHeight, flexShrink: 0, borderTop: '1px solid #1f1f2e', overflow: 'hidden' }}>
              <Terminal />
            </div>
          )}
        </div>

        {/* Chat resize handle */}
        <div
          onMouseDown={makeHorizResizer(setChatWidth, chatWidth, MIN_CHAT, MAX_CHAT, -1)}
          style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: '#1f1f2e', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#7c6df5'}
          onMouseLeave={e => e.currentTarget.style.background = '#1f1f2e'}
        />

        {/* ─ Right: AI Chat ─ */}
        <div style={{ width: chatWidth, flexShrink: 0, overflow: 'hidden', borderLeft: '1px solid #1f1f2e' }}>
          <AIChatPanel />
        </div>
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
      {newFileDlg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }}>
          <div style={{ width: 360, background: '#13131e', border: '1px solid #2a2a3d', borderRadius: 12, padding: 14 }}>
            <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>New file name (e.g. main.py)</div>
            <input
              autoFocus
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmNewFile() }}
              style={{ width: '100%', padding: '8px 10px', background: '#080810', border: '1px solid #2a2a3d', color: '#e8e8f0', borderRadius: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <button onClick={() => setNewFileDlg(false)} style={{ background: 'none', border: '1px solid #2a2a3d', color: '#aaaacc', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmNewFile} style={{ background: '#7c6df5', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
