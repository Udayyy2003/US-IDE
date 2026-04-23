import React, { useState } from 'react'
import { useFiles } from '../contexts/FileContext'
import { useTabs } from '../contexts/TabContext'

const LANGUAGES = [
  { id: 'python', label: 'Python', icon: '🐍', ext: '.py' },
  { id: 'c', label: 'C', icon: '⚙️', ext: '.c' },
  { id: 'cpp', label: 'C++', icon: '⚡', ext: '.cpp' },
  { id: 'java', label: 'Java', icon: '☕', ext: '.java' },
]

export default function NewProjectModal({ onClose, onProjectCreated }) {
  const [step, setStep] = useState(1)
  const [projectName, setProjectName] = useState('')
  const [language, setLanguage] = useState(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { openProject } = useFiles()
  const { openTab } = useTabs()

  const defaultFileName = language ? `main${language.ext}` : ''

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      const folderPath = await window.api.selectFolder()
      if (!folderPath) { setLoading(false); return }

      const finalFile = (fileName.trim() || defaultFileName)
      const res = await window.api.createProject(folderPath, projectName.trim(), language.id, finalFile, '')

      if (res.success) {
        openProject({ name: projectName.trim(), path: res.projectPath })
        openTab({ path: res.filePath, name: finalFile, content: '', language: language.id })
        onProjectCreated?.()
        onClose()
      } else {
        throw new Error(res.error)
      }
    } catch (e) {
      setError(e.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#13131e', border: '1px solid #2a2a40', borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 60px rgba(124,109,245,0.2)', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #1f1f2e' }}>
          <div>
            <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: 16 }}>New Project</div>
            <div style={{ color: '#555570', fontSize: 12, marginTop: 2 }}>Step {step} of 3</div>
          </div>
          <button onClick={onClose} style={{ ...closeBtnStyle }}>✕</button>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, padding: '14px 20px 0' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: s <= step ? '#7c6df5' : '#2a2a3d', transition: 'background 0.2s' }} />
          ))}
        </div>

        <div style={{ padding: '16px 20px 20px' }}>
          {error && (
            <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', color: '#ff4d6d', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Step 1: Name */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ color: '#aaaacc', fontSize: 13, fontWeight: 500 }}>Project Name</label>
              <input
                type="text" autoFocus
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && projectName.trim() && setStep(2)}
                placeholder="my-awesome-project"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#7c6df5'}
                onBlur={e => e.target.style.borderColor = '#2a2a3d'}
              />
              <button onClick={() => projectName.trim() && setStep(2)} disabled={!projectName.trim()} style={{ ...primaryBtn, opacity: projectName.trim() ? 1 : 0.4 }}>Continue →</button>
            </div>
          )}

          {/* Step 2: Language */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ color: '#aaaacc', fontSize: 13, fontWeight: 500 }}>Select Language</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {LANGUAGES.map(lang => (
                  <button key={lang.id} onClick={() => setLanguage(lang)}
                    style={{ padding: '14px', borderRadius: 12, border: `1px solid ${language?.id === lang.id ? '#7c6df5' : '#2a2a3d'}`, background: language?.id === lang.id ? 'rgba(124,109,245,0.12)' : '#0a0a0f', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{lang.icon}</div>
                    <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: 13 }}>{lang.label}</div>
                    <div style={{ color: '#555570', fontSize: 11, fontFamily: 'monospace' }}>{lang.ext}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} style={secondaryBtn}>← Back</button>
                <button onClick={() => language && setStep(3)} disabled={!language} style={{ ...primaryBtn, flex: 1, opacity: language ? 1 : 0.4 }}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3: File name + create */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ color: '#aaaacc', fontSize: 13, fontWeight: 500 }}>File Name <span style={{ color: '#555570' }}>(optional)</span></label>
                <input
                  type="text" autoFocus
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder={defaultFileName}
                  style={{ ...inputStyle, marginTop: 8 }}
                  onFocus={e => e.target.style.borderColor = '#7c6df5'}
                  onBlur={e => e.target.style.borderColor = '#2a2a3d'}
                />
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(124,109,245,0.06)', border: '1px solid rgba(124,109,245,0.18)', fontSize: 12, fontFamily: 'monospace', color: '#9d8fff' }}>
                <div>project: <span style={{ color: '#e8e8f0' }}>{projectName}</span></div>
                <div>language: <span style={{ color: '#e8e8f0' }}>{language?.label}</span></div>
                <div>file: <span style={{ color: '#e8e8f0' }}>{fileName || defaultFileName}</span></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={secondaryBtn}>← Back</button>
                <button onClick={handleCreate} disabled={loading} style={{ ...primaryBtn, flex: 1 }}>
                  {loading ? 'Creating…' : '🚀 Create Project'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
  background: '#080810', border: '1px solid #2a2a3d', color: '#e8e8f0',
  outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box',
  caretColor: '#7c6df5', transition: 'border-color 0.15s',
}
const primaryBtn = {
  padding: '11px', borderRadius: 10, background: '#7c6df5', color: '#fff',
  border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
  fontFamily: 'Inter, system-ui, sans-serif', transition: 'opacity 0.15s',
}
const secondaryBtn = {
  padding: '11px 16px', borderRadius: 10, background: 'none',
  border: '1px solid #2a2a3d', color: '#aaaacc', cursor: 'pointer',
  fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif',
}
const closeBtnStyle = {
  width: 30, height: 30, borderRadius: 8, background: 'none',
  border: 'none', color: '#555570', cursor: 'pointer', fontSize: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
