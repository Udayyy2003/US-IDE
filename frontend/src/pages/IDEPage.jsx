import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveFile, runCode } from '../utils/api'
import { useIDE } from '../contexts/IDEContext'
import { useAuth } from '../contexts/AuthContext'

import TopBar from '../components/TopBar'
import FileExplorer from '../components/FileExplorer'
import CodeEditor from '../components/CodeEditor'
import Terminal from '../components/Terminal'
import AIChatPanel from '../components/AIChatPanel'
import NewProjectModal from '../components/NewProjectModal'
import ProjectSelector from '../components/ProjectSelector'

// Resizable panel sizes (in percent)
const DEFAULT_SIDEBAR_WIDTH = 220
const DEFAULT_CHAT_WIDTH = 300
const DEFAULT_TERMINAL_HEIGHT = 200

export default function IDEPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentProject, currentFile, currentLanguage,
    editorContent, setEditorContent,
    addTerminalLine, clearTerminal,
    setIsRunning, setIsSaving,
    isRunning, terminalInput
  } = useIDE()

  const [showNewProject, setShowNewProject] = useState(false)
  const [showProjectSelector, setShowProjectSelector] = useState(false)
  const [terminalHeight, setTerminalHeight] = useState(DEFAULT_TERMINAL_HEIGHT)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH)

  // ─── Save File ───────────────────────────────
  const handleSave = useCallback(async () => {
    if (!currentProject || !currentFile) return
    setIsSaving(true)
    try {
      await saveFile({
        projectName: currentProject.name,
        fileName: currentFile,
        content: editorContent,
      })
    } catch (e) {
      console.error('Save failed', e)
    } finally {
      setIsSaving(false)
    }
  }, [currentProject, currentFile, editorContent, setIsSaving])

  // ─── Run Code ───────────────────────────────
  const handleRun = useCallback(async () => {
    if (!currentProject || !currentFile || isRunning) return

    // Auto-save first
    setIsSaving(true)
    try {
      await saveFile({
        projectName: currentProject.name,
        fileName: currentFile,
        content: editorContent,
      })
      // Trigger execution via state - the Terminal component will handle the socket emit
      setIsRunning(true)
    } catch (e) {
      console.error('Save failed', e)
    } finally {
      setIsSaving(false)
    }
  }, [currentProject, currentFile, editorContent, isRunning, setIsRunning, setIsSaving])

  // ─── Terminal Resize ─────────────────────────
  const handleTerminalResizeStart = useCallback((e) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = terminalHeight

    const onMove = (ev) => {
      const delta = startY - ev.clientY
      const newH = Math.max(80, Math.min(600, startH + delta))
      setTerminalHeight(newH)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [terminalHeight])

  // ─── Sidebar Resize ──────────────────────────
  const handleSidebarResizeStart = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = sidebarWidth

    const onMove = (ev) => {
      const delta = ev.clientX - startX
      const newW = Math.max(160, Math.min(400, startW + delta))
      setSidebarWidth(newW)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [sidebarWidth])

  // ─── Chat Resize ─────────────────────────────
  const handleChatResizeStart = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = chatWidth

    const onMove = (ev) => {
      const delta = startX - ev.clientX
      const newW = Math.max(200, Math.min(500, startW + delta))
      setChatWidth(newW)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [chatWidth])

  // Keyboard shortcut Ctrl+Enter to run
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleRun()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleRun])

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* Top Bar */}
      <TopBar
        onSave={handleSave}
        onRun={handleRun}
        onNewProject={() => setShowNewProject(true)}
        onOpenProject={() => setShowProjectSelector(true)}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: File Explorer */}
        <div
          className="flex-none border-r border-border-subtle overflow-hidden"
          style={{ width: sidebarWidth, background: '#111118' }}
        >
          <FileExplorer onOpenProject={() => setShowProjectSelector(true)} />
        </div>

        {/* Sidebar resize handle */}
        <div
          className="resize-handle w-1 flex-none cursor-col-resize"
          style={{ background: '#1f1f2e' }}
          onMouseDown={handleSidebarResizeStart}
        />

        {/* Center: Editor + Terminal */}
        <div className="flex flex-col flex-1 overflow-hidden">
          
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor onSave={handleSave} />
          </div>

          {/* Terminal resize handle */}
          <div
            className="resize-handle h-1 flex-none cursor-row-resize"
            style={{ background: '#1f1f2e' }}
            onMouseDown={handleTerminalResizeStart}
          />

          {/* Terminal */}
          <div
            className="flex-none border-t border-border-subtle overflow-hidden"
            style={{ height: terminalHeight }}
          >
            <Terminal onClear={clearTerminal} />
          </div>
        </div>

        {/* Chat resize handle */}
        <div
          className="resize-handle w-1 flex-none cursor-col-resize"
          style={{ background: '#1f1f2e' }}
          onMouseDown={handleChatResizeStart}
        />

        {/* Right Sidebar: AI Chat */}
        <div
          className="flex-none border-l border-border-subtle overflow-hidden"
          style={{ width: chatWidth, background: '#111118' }}
        >
          <AIChatPanel />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 border-t border-border-subtle" style={{ height: 24, background: '#0a0a0f', minHeight: 24 }}>
        <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
          {currentProject && (
            <>
              <span>{currentProject.name}</span>
              <span>·</span>
              <span>{currentLanguage?.toUpperCase()}</span>
            </>
          )}
          {currentFile && (
            <>
              <span>·</span>
              <span>{currentFile}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
          <span>US-IDE v1.0</span>
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
        </div>
      </div>

      {/* Modals */}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onProjectCreated={() => {}}
        />
      )}

      {showProjectSelector && (
        <ProjectSelector
          onClose={() => setShowProjectSelector(false)}
          onNewProject={() => {
            setShowProjectSelector(false)
            setShowNewProject(true)
          }}
        />
      )}
    </div>
  )
}
