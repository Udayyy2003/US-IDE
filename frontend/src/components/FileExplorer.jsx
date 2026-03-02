import React, { useEffect, useState } from 'react'
import { getProjectFiles, createFile, loadFile } from '../utils/api'
import { useIDE } from '../contexts/IDEContext'

const FILE_ICONS = {
  '.py': '🐍', '.c': '⚙️', '.cpp': '⚡', '.java': '☕',
  '.js': '🟡', '.html': '🌐', '.css': '🎨', '.json': '📋',
  '.md': '📝', '.txt': '📄',
}

function getFileIcon(name) {
  const ext = name.includes('.') ? '.' + name.split('.').pop() : ''
  return FILE_ICONS[ext] || '📄'
}

function getLangFromExt(filename) {
  const ext = filename.split('.').pop()
  const map = { py: 'python', c: 'c', cpp: 'cpp', java: 'java', js: 'javascript', ts: 'typescript', html: 'html', css: 'css', json: 'json' }
  return map[ext] || 'plaintext'
}

export default function FileExplorer({ onOpenProject }) {
  const { currentProject, currentFile, setCurrentFile, setEditorContent, setCurrentLanguage } = useIDE()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [showNewFile, setShowNewFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (currentProject) loadFiles()
  }, [currentProject])

  const loadFiles = async () => {
    if (!currentProject) return
    setLoading(true)
    try {
      const res = await getProjectFiles(currentProject.name)
      setFiles(res.data.files || [])
    } catch (e) {
      console.error('Failed to load files', e)
    } finally {
      setLoading(false)
    }
  }

  const handleFileClick = async (fileName) => {
    if (!currentProject || currentFile === fileName) return
    try {
      const res = await loadFile(currentProject.name, fileName)
      setCurrentFile(fileName)
      setEditorContent(res.data.content)
      setCurrentLanguage(getLangFromExt(fileName))
    } catch (e) {
      console.error('Failed to load file', e)
    }
  }

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !currentProject) return
    setCreating(true)
    try {
      await createFile({
        projectName: currentProject.name,
        fileName: newFileName,
        content: ''
      })
      setShowNewFile(false)
      setNewFileName('')
      loadFiles()
    } catch (e) {
      console.error('Failed to create file', e)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Explorer Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle" style={{ minHeight: 36 }}>
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Explorer</span>
        <button
          onClick={() => setShowNewFile(true)}
          title="New File"
          className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Project name */}
      {currentProject && (
        <div className="px-3 py-2 border-b border-border-subtle">
          <button
            onClick={onOpenProject}
            className="flex items-center gap-2 w-full text-left"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-text-muted">
              <path d="M2 3h5l1.5 2H14v9H2V3z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            </svg>
            <span className="text-text-primary text-xs font-semibold truncate">{currentProject.name}</span>
          </button>
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {!currentProject ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-3xl mb-2">📁</div>
            <p className="text-text-muted text-xs">No project open</p>
            <button
              onClick={onOpenProject}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'rgba(124, 109, 245, 0.15)', color: '#9d8fff' }}
            >
              Open Project
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="spinner" style={{ width: 16, height: 16 }} />
          </div>
        ) : (
          <>
            {files.map(file => (
              <button
                key={file}
                onClick={() => handleFileClick(file)}
                className={`file-item w-full flex items-center gap-2 px-4 py-1.5 text-left ${currentFile === file ? 'active' : ''}`}
              >
                <span className="text-xs">{getFileIcon(file)}</span>
                <span className="text-xs truncate" style={{ color: currentFile === file ? '#e8e8f0' : '#8888a8' }}>{file}</span>
              </button>
            ))}

            {/* New file input */}
            {showNewFile && (
              <div className="px-3 py-2">
                <input
                  type="text"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateFile()
                    if (e.key === 'Escape') { setShowNewFile(false); setNewFileName('') }
                  }}
                  placeholder="filename.py"
                  autoFocus
                  className="w-full px-2 py-1 text-xs font-mono rounded outline-none"
                  style={{ background: '#0a0a0f', border: '1px solid #7c6df5', color: '#e8e8f0' }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
