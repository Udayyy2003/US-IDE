import React, { useState } from 'react'
import { createProject } from '../utils/api'
import { useIDE } from '../contexts/IDEContext'

const LANGUAGES = [
  { id: 'python', label: 'Python', icon: '🐍', ext: '.py', color: '#3776AB' },
  { id: 'c',      label: 'C',      icon: '⚙️', ext: '.c',   color: '#A8B9CC' },
  { id: 'cpp',    label: 'C++',    icon: '⚡', ext: '.cpp', color: '#00599C' },
  { id: 'java',   label: 'Java',   icon: '☕', ext: '.java', color: '#ED8B00' },
]

export default function NewProjectModal({ onClose, onProjectCreated }) {
  const [step, setStep] = useState(1)
  const [projectName, setProjectName] = useState('')
  const [language, setLanguage] = useState(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setCurrentProject, setCurrentFile, setCurrentLanguage, setEditorContent } = useIDE()

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await createProject({
        projectName,
        language: language.id,
        fileName: fileName || '',
      })
      const { projectName: pName, language: lang, fileName: fName, content } = res.data
      
      setCurrentProject({ name: pName, language: lang })
      setCurrentLanguage(lang)
      setCurrentFile(fName)
      setEditorContent(content)
      onProjectCreated({ name: pName, language: lang, fileName: fName, content })
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const selectedLang = LANGUAGES.find(l => l.id === language?.id)
  const defaultFileName = selectedLang ? `main${selectedLang.ext}` : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border border-border-default animate-slide-up" style={{ background: '#13131d', boxShadow: '0 0 60px rgba(124, 109, 245, 0.2)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div>
            <h2 className="text-text-primary font-semibold text-lg">New Project</h2>
            <p className="text-text-muted text-sm mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-6 pt-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all" style={{ background: s <= step ? '#7c6df5' : '#2a2a3d' }} />
          ))}
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(255, 77, 109, 0.1)', border: '1px solid rgba(255, 77, 109, 0.3)', color: '#ff4d6d' }}>
              {error}
            </div>
          )}

          {/* Step 1: Project Name */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-text-secondary text-sm mb-2 font-medium">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && projectName.trim() && setStep(2)}
                  placeholder="my-awesome-project"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-text-primary font-mono text-sm outline-none transition-all"
                  style={{ background: '#0a0a0f', border: '1px solid #2a2a3d', caretColor: '#7c6df5' }}
                  onFocus={e => e.target.style.borderColor = '#7c6df5'}
                  onBlur={e => e.target.style.borderColor = '#2a2a3d'}
                />
              </div>
              <button
                onClick={() => projectName.trim() && setStep(2)}
                disabled={!projectName.trim()}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                style={{ background: projectName.trim() ? '#7c6df5' : '#2a2a3d', color: '#fff' }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Language */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-text-secondary text-sm mb-3 font-medium">Select Language</label>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang)}
                      className="p-4 rounded-xl border text-left transition-all"
                      style={{
                        background: language?.id === lang.id ? 'rgba(124, 109, 245, 0.15)' : '#0a0a0f',
                        borderColor: language?.id === lang.id ? '#7c6df5' : '#2a2a3d',
                      }}
                    >
                      <div className="text-2xl mb-2">{lang.icon}</div>
                      <div className="text-text-primary font-semibold text-sm">{lang.label}</div>
                      <div className="text-text-muted text-xs font-mono">{lang.ext}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm text-text-secondary transition-colors hover:text-text-primary" style={{ border: '1px solid #2a2a3d' }}>
                  ← Back
                </button>
                <button
                  onClick={() => language && setStep(3)}
                  disabled={!language}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                  style={{ background: language ? '#7c6df5' : '#2a2a3d', color: '#fff' }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: File Name */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-text-secondary text-sm mb-2 font-medium">
                  File Name <span className="text-text-muted">(optional)</span>
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder={defaultFileName}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-text-primary font-mono text-sm outline-none transition-all"
                  style={{ background: '#0a0a0f', border: '1px solid #2a2a3d', caretColor: '#7c6df5' }}
                  onFocus={e => e.target.style.borderColor = '#7c6df5'}
                  onBlur={e => e.target.style.borderColor = '#2a2a3d'}
                />
                <p className="text-text-muted text-xs mt-2">Leave blank to use default: <span className="font-mono text-accent-primary">{defaultFileName}</span></p>
              </div>

              {/* Summary */}
              <div className="p-3 rounded-xl" style={{ background: 'rgba(124, 109, 245, 0.08)', border: '1px solid rgba(124, 109, 245, 0.2)' }}>
                <div className="text-xs space-y-1 font-mono">
                  <div><span className="text-text-muted">project:</span> <span className="text-accent-primary">{projectName}</span></div>
                  <div><span className="text-text-muted">language:</span> <span className="text-accent-primary">{language?.label}</span></div>
                  <div><span className="text-text-muted">file:</span> <span className="text-accent-primary">{fileName || defaultFileName}</span></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-sm text-text-secondary transition-colors hover:text-text-primary" style={{ border: '1px solid #2a2a3d' }}>
                  ← Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: '#7c6df5', color: '#fff' }}
                >
                  {loading ? <span className="flex items-center justify-center gap-2"><div className="spinner" style={{ width: 16, height: 16 }} /> Creating...</span> : '🚀 Create Project'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
