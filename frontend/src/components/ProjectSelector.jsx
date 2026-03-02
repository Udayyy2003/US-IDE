import React, { useEffect, useState } from 'react'
import { getProjects, getProjectFiles, loadFile } from '../utils/api'
import { useIDE } from '../contexts/IDEContext'

const LANG_ICONS = { python: '🐍', c: '⚙️', cpp: '⚡', java: '☕' }
const LANG_EXT = { python: '.py', c: '.c', cpp: '.cpp', java: '.java' }

function getLangFromExt(filename) {
  const ext = filename.split('.').pop()
  const map = { py: 'python', c: 'c', cpp: 'cpp', java: 'java' }
  return map[ext] || 'python'
}

export default function ProjectSelector({ onClose, onNewProject }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const { setCurrentProject, setCurrentFile, setCurrentLanguage, setEditorContent, setFileTree } = useIDE()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await getProjects()
      setProjects(res.data.projects || [])
    } catch (e) {
      console.error('Failed to load projects', e)
    } finally {
      setLoading(false)
    }
  }

  const openProject = async (project) => {
    try {
      // Load project files
      const filesRes = await getProjectFiles(project.name)
      const files = filesRes.data.files || []

      setCurrentProject(project)
      setCurrentLanguage(project.language)
      setFileTree(files)

      // Load first file
      if (files.length > 0) {
        const mainFile = files.find(f => !f.includes('/')) || files[0]
        const contentRes = await loadFile(project.name, mainFile)
        setCurrentFile(mainFile)
        setEditorContent(contentRes.data.content)
        setCurrentLanguage(getLangFromExt(mainFile))
      }

      onClose()
    } catch (e) {
      console.error('Failed to open project', e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl border border-border-default animate-slide-up" style={{ background: '#13131d', boxShadow: '0 0 60px rgba(124, 109, 245, 0.2)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h2 className="text-text-primary font-semibold">Open Project</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: '#7c6df5', color: '#fff' }}
            >
              + New Project
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Project list */}
        <div className="p-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" style={{ width: 24, height: 24 }} />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📁</div>
              <p className="text-text-secondary font-semibold text-sm">No projects yet</p>
              <p className="text-text-muted text-xs mt-1">Create your first project to get started</p>
              <button
                onClick={onNewProject}
                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: '#7c6df5', color: '#fff' }}
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map(project => (
                <button
                  key={project.name}
                  onClick={() => openProject(project)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-bg-hover group"
                  style={{ border: '1px solid transparent' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a3d'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(124, 109, 245, 0.1)' }}>
                    {LANG_ICONS[project.language] || '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-text-primary font-semibold text-sm truncate">{project.name}</div>
                    <div className="text-text-muted text-xs font-mono mt-0.5">
                      {project.language?.toUpperCase()}
                      {project.createdAt && <> · {new Date(project.createdAt).toLocaleDateString()}</>}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
