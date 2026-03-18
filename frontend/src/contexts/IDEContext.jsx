import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

const IDEContext = createContext(null)

export function IDEProvider({ children }) {
  // ─── Workspace & Project ───────────────────
  const [workspaceRoot, setWorkspaceRoot] = useState(null)
  const [currentProject, setCurrentProject] = useState(null)

  // ─── Open Tabs ─────────────────────────────
  // Each tab: { path, name, content, language, unsaved }
  const [openFiles, setOpenFiles] = useState([])
  const [currentFile, setCurrentFile] = useState(null)
  const [currentLanguage, setCurrentLanguage] = useState('python')
  const [editorContent, setEditorContent] = useState('')

  // ─── File Tree ─────────────────────────────
  const [fileTree, setFileTree] = useState([])

  // ─── Terminal ──────────────────────────────
  const [isRunning, setIsRunning] = useState(false)
  const [terminalVisible, setTerminalVisible] = useState(true)

  // ─── UI State ──────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [autoSave, setAutoSave] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // ─── AutoSave Debounce ─────────────────────
  const autoSaveTimer = useRef(null)

  // ─── Tab Operations ────────────────────────

  /** Open (or switch to) a file in a tab */
  const openFileInTab = useCallback((file) => {
    setOpenFiles(prev => {
      const exists = prev.find(f => f.path === file.path)
      if (exists) return prev
      return [...prev, { ...file, unsaved: false }]
    })
    setCurrentFile(file.path)
    setCurrentLanguage(file.language)
    setEditorContent(file.content)
  }, [])

  /** Close a file tab */
  const closeFileTab = useCallback((filePath) => {
    setOpenFiles(prev => {
      const newFiles = prev.filter(f => f.path !== filePath)
      setCurrentFile(cur => {
        if (cur === filePath) {
          if (newFiles.length > 0) {
            const last = newFiles[newFiles.length - 1]
            setCurrentLanguage(last.language)
            setEditorContent(last.content)
            return last.path
          }
          setEditorContent('')
          return null
        }
        return cur
      })
      return newFiles
    })
  }, [])

  /** Update in-memory tab content (called from editor onChange) */
  const updateTabContent = useCallback((filePath, content) => {
    setOpenFiles(prev => prev.map(f =>
      f.path === filePath ? { ...f, content, unsaved: true } : f
    ))
  }, [])

  /** Mark a tab as saved */
  const markSaved = useCallback((filePath) => {
    setOpenFiles(prev => prev.map(f =>
      f.path === filePath ? { ...f, unsaved: false } : f
    ))
  }, [])

  // ─── Workspace ─────────────────────────────

  const openProject = useCallback((project) => {
    setCurrentProject(project)
    setWorkspaceRoot(project?.path || null)
    setOpenFiles([])
    setCurrentFile(null)
    setEditorContent('')
    setFileTree([])
  }, [])

  // ─── AutoSave Logic ────────────────────────

  const triggerAutoSave = useCallback((filePath, content) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      if (filePath && window.api) {
        await window.api.saveFile(workspaceRoot, filePath, content)
        markSaved(filePath)
      }
    }, 2000)
  }, [markSaved, workspaceRoot])

  // ─── Editor Content Setter (with autosave) ─

  const handleEditorChange = useCallback((value, filePath) => {
    const content = value || ''
    setEditorContent(content)
    updateTabContent(filePath, content)
    if (autoSave && filePath) {
      triggerAutoSave(filePath, content)
    }
  }, [autoSave, updateTabContent, triggerAutoSave])

  return (
    <IDEContext.Provider value={{
      // Workspace
      workspaceRoot, setWorkspaceRoot,
      currentProject, setCurrentProject,
      openProject,

      // Tabs
      openFiles, setOpenFiles,
      openFileInTab, closeFileTab,
      updateTabContent, markSaved,

      // Current file
      currentFile, setCurrentFile,
      currentLanguage, setCurrentLanguage,
      editorContent, setEditorContent,
      handleEditorChange,

      // File tree
      fileTree, setFileTree,

      // Terminal
      isRunning, setIsRunning,
      terminalVisible, setTerminalVisible,

      // UI
      isSaving, setIsSaving,
      autoSave, setAutoSave,
      commandPaletteOpen, setCommandPaletteOpen,
    }}>
      {children}
    </IDEContext.Provider>
  )
}

export const useIDE = () => useContext(IDEContext)
