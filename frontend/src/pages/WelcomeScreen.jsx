import React, { useEffect, useState } from 'react'
import { useFiles } from '../contexts/FileContext'

export default function WelcomeScreen({ onWorkspaceOpened }) {
  const { openProject } = useFiles()
  const [lastPath, setLastPath] = useState(null)
  const [loading, setLoading] = useState(false)
  const isElectron = typeof window !== 'undefined' && (!!window.api || !!window.electron)

  // Ensure window.api is consistently available if either exists
  if (typeof window !== 'undefined' && !window.api && window.electron) {
    window.api = window.electron;
  }

  // Load last workspace on mount
  useEffect(() => {
    if (window.api?.getWorkspace) {
      window.api.getWorkspace().then(data => {
        if (data?.lastPath) setLastPath(data.lastPath)
      }).catch(() => { })
    }
  }, [])

  const handleOpenFolder = async () => {
    setLoading(true)
    try {
      if (!isElectron || !window.api) { 
        alert('This page is running in a browser. Please run "npm run dev" to launch the Electron app for filesystem access.'); 
        return;
      }
      const folder = await window.api.openFolder?.()
      if (folder) {
        const name = folder.split(/[\\/]/).pop()
        openProject({ name, path: folder })
        onWorkspaceOpened?.()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenFile = async () => {
    setLoading(true)
    try {
      if (!isElectron || !window.api) { 
        alert('This page is running in a browser. Please run "npm run dev" to launch the Electron app for filesystem access.'); 
        return;
      }
      const res = await window.api.openFile?.()
      if (res?.path) {
        const name = res.path.split(/[\\/]/).pop()
        const ext = name.split('.').pop().toLowerCase()
        const langMap = { py: 'python', c: 'c', cpp: 'cpp', java: 'java', js: 'javascript', ts: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown' }
        const language = langMap[ext] || 'plaintext'
        // Set workspace to the file's parent folder
        const parentDir = res.path.substring(0, Math.max(res.path.lastIndexOf('/'), res.path.lastIndexOf('\\')))
        openProject({ name: parentDir.split(/[\\/]/).pop() || name, path: parentDir })
        // The IDE page will handle opening this specific file
        window.__pendingOpenFile = { path: res.path, name, content: res.content, language }
        onWorkspaceOpened?.()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReopen = async () => {
    if (!lastPath) return
    setLoading(true)
    try {
      const name = lastPath.split(/[\\/]/).pop()
      openProject({ name, path: lastPath })
      onWorkspaceOpened?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Glow background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '15%', left: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,109,245,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520, padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: '#fff', 
            marginRight: '8px',
            letterSpacing: '-1px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Outfit', sans-serif"
          }}>
            US
          </div>
          <div>
            <div style={{ color: '#e8e8f0', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>US-IDE</div>
            <div style={{ color: '#555570', fontSize: 12, fontFamily: 'monospace' }}>AI-Powered Desktop IDE  v1.2.0</div>
          </div>
        </div>

        {/* Action cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ActionCard
            icon="📂"
            title="Open Folder"
            desc="Open any folder as your workspace"
            shortcut="Ctrl+Shift+O"
            onClick={handleOpenFolder}
            primary
            disabled={loading}
          />
          <ActionCard
            icon="📄"
            title="Open File"
            desc="Open a single file to start editing"
            shortcut="Ctrl+O"
            onClick={handleOpenFile}
            disabled={loading}
          />
          {lastPath && (
            <ActionCard
              icon="🔄"
              title="Reopen Last Workspace"
              desc={<span style={{ fontFamily: 'monospace', fontSize: 11, color: '#7c6df5', wordBreak: 'break-all' }}>{lastPath}</span>}
              onClick={handleReopen}
              disabled={loading}
            />
          )}
        </div>

        {/* Footer hint */}
        <div style={{ marginTop: 32, textAlign: 'center', color: '#333348', fontSize: 11, fontFamily: 'monospace' }}>
          {isElectron
            ? 'Ctrl+Shift+P · Command Palette · Ctrl+` · Terminal'
            : 'Electron APIs unavailable in browser. Run \"npm run dev\" to use filesystem features.'}
        </div>
      </div>
    </div>
  )
}

function ActionCard({ icon, title, desc, shortcut, onClick, primary, disabled }) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        borderRadius: 14,
        border: primary
          ? `1px solid rgba(124,109,245,${hovered ? 0.5 : 0.25})`
          : `1px solid rgba(255,255,255,${hovered ? 0.1 : 0.05})`,
        background: primary
          ? `rgba(124,109,245,${hovered ? 0.12 : 0.07})`
          : hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.5 : 1,
        width: '100%',
      }}
    >
      <div style={{ fontSize: 22, lineHeight: 1 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: 14 }}>{title}</div>
        <div style={{ color: '#555570', fontSize: 12, marginTop: 2 }}>{desc}</div>
      </div>
      {shortcut && (
        <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#333355', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
          {shortcut}
        </div>
      )}
    </button>
  )
}
