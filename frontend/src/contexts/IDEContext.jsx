import React, { createContext, useContext, useState, useCallback } from 'react'

const IDEContext = createContext(null)

export function IDEProvider({ children }) {
  const [currentProject, setCurrentProject] = useState(null)
  const [currentFile, setCurrentFile] = useState(null)
  const [currentLanguage, setCurrentLanguage] = useState('python')
  const [editorContent, setEditorContent] = useState('')
  const [terminalOutput, setTerminalOutput] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fileTree, setFileTree] = useState([])
  const [terminalInput, setTerminalInput] = useState('')

  const addTerminalLine = useCallback((line, type = 'output') => {
    setTerminalOutput(prev => [...prev, { text: line, type, timestamp: Date.now() }])
  }, [])

  const clearTerminal = useCallback(() => {
    setTerminalOutput([])
  }, [])

  const openProject = useCallback((project) => {
    setCurrentProject(project)
    setCurrentFile(null)
    setEditorContent('')
    setTerminalOutput([])
  }, [])

  return (
    <IDEContext.Provider value={{
      currentProject,
      setCurrentProject,
      currentFile,
      setCurrentFile,
      currentLanguage,
      setCurrentLanguage,
      editorContent,
      setEditorContent,
      terminalOutput,
      setTerminalOutput,
      addTerminalLine,
      clearTerminal,
      isRunning,
      setIsRunning,
      isSaving,
      setIsSaving,
      fileTree,
      setFileTree,
      terminalInput,
      setTerminalInput,
      openProject,
    }}>
      {children}
    </IDEContext.Provider>
  )
}

export const useIDE = () => useContext(IDEContext)
