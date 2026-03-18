import React from 'react'
import { useIDE } from '../contexts/IDEContext'

const LANG_LABELS = {
  python: { icon: '🐍', label: 'Python' },
  c: { icon: '⚙️', label: 'C' },
  cpp: { icon: '⚡', label: 'C++' },
  java: { icon: '☕', label: 'Java' },
  javascript: { icon: '🟡', label: 'JS' },
  typescript: { icon: '🔷', label: 'TS' },
  html: { icon: '🌐', label: 'HTML' },
  css: { icon: '🎨', label: 'CSS' },
}

export default function TopBar({
  onSave, onRun, onOpenFile, onOpenFolder,
  onNewFile, onNewProject, onToggleTerminal, onCommandPalette,
}) {
  const {
    currentProject, currentLanguage,
    isRunning, isSaving,
    autoSave, setAutoSave,
    terminalVisible,
    openFiles, currentFile,
  } = useIDE()

  const lang = LANG_LABELS[currentLanguage] || { icon: '📄', label: currentLanguage || '' }
  const curTab = openFiles.find(f => f.path === currentFile)
  const unsaved = curTab?.unsaved

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: 56, background: '#0a0a0f',
      borderBottom: '1px solid #1a1a28', flexShrink: 0,
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      {/* ─ Left: Logo + Project ─ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: 10, 
          background: 'linear-gradient(135deg, #7c6df5, #00d4ff)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          flexShrink: 0,
          boxShadow: '0 0 15px rgba(124,109,245,0.4)'
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, fontFamily: 'monospace' }}>US</span>
        </div>

        <div style={{ width: 1, height: 24, background: '#1f1f32' }} />

        {/* Project / file name */}
        <button
          onClick={onOpenFolder}
          title="Open Folder (Ctrl+Shift+O)"
          style={{ ...btnStyle, gap: 8, maxWidth: 220, padding: '6px 12px', borderRadius: 8 }}
        >
          <span style={{ fontSize: 14 }}>{lang.icon}</span>
          <span style={{ fontSize: 13, color: '#e8e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentProject?.name || 'Open Folder'}
          </span>
          {unsaved && <span style={{ color: '#7c6df5', fontSize: 18, marginLeft: 4 }}>●</span>}
        </button>

        {currentProject && (
          <span style={{ 
            fontSize: 10, fontWeight: 700,
            background: 'rgba(124,109,245,0.1)', color: '#9d8fff', 
            padding: '3px 10px', borderRadius: 6, 
            fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {lang.label}
          </span>
        )}
      </div>

      {/* ─ Center: Action buttons ─ */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: 6, 
        background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <Btn onClick={onNewFile} title="New File (Ctrl+N)" icon="📄" label="New" />
        <Btn onClick={onOpenFile} title="Open File (Ctrl+O)" icon="📂" label="Open" />
        <Btn
          onClick={onSave}
          title="Save (Ctrl+S)"
          icon={isSaving ? '…' : '💾'}
          label={isSaving ? 'Saving' : 'Save'}
          disabled={!currentFile}
        />
        <div style={{ width: 1, height: 20, background: '#1f1f32', margin: '0 4px' }} />
        <Btn
          onClick={onRun}
          title="Run (Ctrl+Enter)"
          icon={isRunning ? '⏹' : '▶'}
          label={isRunning ? 'Running' : 'Run'}
          primary
          disabled={!currentFile || isRunning}
        />
        <div style={{ width: 1, height: 20, background: '#1f1f32', margin: '0 4px' }} />
        <Btn
          onClick={() => setAutoSave(v => !v)}
          title={autoSave ? 'Disable Auto Save' : 'Enable Auto Save'}
          icon="⚡"
          label="Auto"
          active={autoSave}
        />
        <Btn onClick={onToggleTerminal} title="Toggle Terminal (Ctrl+`)" icon="⬛" label={terminalVisible ? 'Hide Term' : 'Terminal'} />
        <Btn onClick={onCommandPalette} title="Command Palette (Ctrl+Shift+P)" icon="⌨️" label="Palette" />
      </div>

      {/* ─ Right: Status ─ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 600, fontFamily: 'monospace', color: '#444466' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e888', boxShadow: '0 0 8px #00e888' }} />
          <span>STABLE</span>
        </div>
        <div style={{ width: 1, height: 16, background: '#1f1f32' }} />
        <span style={{ color: '#555570' }}>US-IDE v1.0</span>
      </div>
    </div>
  )
}

const btnStyle = {
  display: 'flex', alignItems: 'center', border: 'none',
  cursor: 'pointer', borderRadius: 6, padding: '4px 8px',
  background: 'none', transition: 'background 0.12s, color 0.12s',
  fontFamily: 'Inter, system-ui, sans-serif',
}

function Btn({ onClick, title, icon, label, primary, active, disabled }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...btnStyle,
        gap: 5,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: primary
          ? (hov ? 'rgba(0,232,136,0.2)' : 'rgba(0,232,136,0.1)')
          : active
            ? 'rgba(124,109,245,0.15)'
            : hov ? 'rgba(255,255,255,0.06)' : 'none',
        border: primary ? '1px solid rgba(0,232,136,0.3)' : active ? '1px solid rgba(124,109,245,0.3)' : '1px solid transparent',
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 11, color: primary ? '#00e888' : active ? '#9d8fff' : '#888898', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  )
}
