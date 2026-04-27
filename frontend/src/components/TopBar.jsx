  import React, { useState, useRef, useEffect } from 'react'
import { useIDE } from '../contexts/IDEContext'
import { useFiles } from '../contexts/FileContext'
import { useTabs } from '../contexts/TabContext'
import { useEditor } from '../contexts/EditorContext'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'

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
  onSaveAll, onLogout
}) {
  const {
    isRunning,
    terminalVisible,
    setVoiceSearchOpen,
  } = useIDE()

  const { setIsCustomizePanelOpen } = useSettings()

  const { currentProject } = useFiles()
  const { tabs, activeTabIndex, closeTab, closeAllTabs } = useTabs()
  const { currentFile, isSaving, autoSave, setAutoSave } = useEditor()
  const { user, logout: contextLogout } = useAuth()

  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const fileMenuRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) {
        setFileMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isElectron = typeof window !== 'undefined' && !!window.api

  useEffect(() => {
    if (isElectron) {
      console.log("[TopBar] Electron API detected. Window controls should be visible.");
    } else {
      console.warn("[TopBar] Electron API NOT detected. Window controls hidden.");
    }
  }, [isElectron]);

  const currentLanguage = tabs[activeTabIndex]?.language
  const lang = LANG_LABELS[currentLanguage] || { icon: '📄', label: currentLanguage || '' }
  const curTab = tabs[activeTabIndex]
  const unsaved = curTab?.unsaved

  const MenuItem = ({ label, shortcut, onClick, danger, icon }) => (
    <div
      onClick={() => { onClick?.(); setFileMenuOpen(false) }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', cursor: 'pointer', fontSize: 12,
        color: danger ? '#ff4d6d' : '#e8e8f0',
        background: 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
        <span>{label}</span>
      </div>
      {shortcut && <span style={{ opacity: 0.4, fontSize: 10, marginLeft: 20 }}>{shortcut}</span>}
    </div>
  )

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: 56, background: '#0a0a0f',
      borderBottom: '1px solid #1a1a28', flexShrink: 0,
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      WebkitAppRegion: 'drag',
    }}>
      {/* ─ Left: Menu ─ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, WebkitAppRegion: 'no-drag', flexShrink: 0 }}>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          color: '#fff', 
          marginRight: '8px',
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: "'Outfit', sans-serif"
        }}>
          US
        </div>

        {/* File Menu Trigger */}
        <div style={{ position: 'relative' }} ref={fileMenuRef}>
          <button
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
            style={{
              ...btnStyle,
              padding: '6px 12px',
              color: '#aaaacc',
              fontSize: 13,
              fontWeight: 600,
              background: fileMenuOpen ? 'rgba(255,255,255,0.06)' : 'none',
              borderRadius: 6,
            }}
          >
            File
          </button>

          {fileMenuOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, zIndex: 1000,
              width: 240, background: '#1a1a28', border: '1px solid #2a2a3d',
              borderRadius: 8, padding: '4px 0', marginTop: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}>
              <MenuItem label="New File" shortcut="Ctrl+N" icon="📄" onClick={onNewFile} />
              <MenuItem label="New Project" icon="📁" onClick={onNewProject} />
              <div style={{ height: 1, background: '#2a2a3d', margin: '4px 0' }} />
              <MenuItem label="Open File..." shortcut="Ctrl+O" icon="📂" onClick={onOpenFile} />
              <MenuItem label="Open Folder..." shortcut="Ctrl+Shift+O" icon="📁" onClick={onOpenFolder} />
              <div style={{ height: 1, background: '#2a2a3d', margin: '4px 0' }} />
              <MenuItem label="Save" shortcut="Ctrl+S" icon="💾" onClick={onSave} />
              <MenuItem label="Save All" shortcut="Ctrl+K S" icon="💾" onClick={onSaveAll} />
              <div style={{ height: 1, background: '#2a2a3d', margin: '4px 0' }} />
              <MenuItem label="Auto Save" icon={autoSave ? "✅" : "⬜"} onClick={() => setAutoSave(!autoSave)} />
              <div style={{ height: 1, background: '#2a2a3d', margin: '4px 0' }} />
              <MenuItem 
                label="Close Editor" 
                shortcut="Ctrl+W" 
                icon="✕" 
                onClick={() => activeTabIndex !== -1 && window.dispatchEvent(new CustomEvent('close-tab', { detail: { index: activeTabIndex } }))} 
              />
              <MenuItem 
                label="Close All Editors" 
                shortcut="Ctrl+K W" 
                icon="✕" 
                onClick={() => window.dispatchEvent(new CustomEvent('close-all-tabs'))} 
                danger 
              />
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, background: '#1f1f32' }} />

        {/* Project / file name */}
        <button
          onClick={isElectron ? onOpenFolder : undefined}
          title={isElectron ? "Open Folder (Ctrl+Shift+O)" : "Open Folder is only available in desktop version"}
          style={{ 
            ...btnStyle, 
            gap: 8, 
            maxWidth: 180, 
            padding: '6px 12px', 
            borderRadius: 8,
            cursor: isElectron ? 'pointer' : 'not-allowed',
            opacity: isElectron ? 1 : 0.6
          }}
        >
          <span style={{ fontSize: 14 }}>{lang.icon}</span>
          <span style={{ fontSize: 13, color: '#e8e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentProject?.name || 'Open Folder'}
          </span>
          {unsaved && <span style={{ color: '#7c6df5', fontSize: 18, marginLeft: 4 }}>●</span>}
        </button>
      </div>

      {/* ─ Center: Action buttons ─ */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: 4, 
        background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.05)',
        WebkitAppRegion: 'no-drag',
        margin: '0 10px',
        overflow: 'hidden',
        flex: '1 1 auto', // Allow it to shrink if needed
        justifyContent: 'center',
        minWidth: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
          <Btn 
            onClick={isElectron ? onNewFile : undefined} 
            title={isElectron ? "New File (Ctrl+N)" : "New File is only available in desktop version"} 
            icon="📄" 
            label="New" 
            disabled={!isElectron}
          />
          <Btn 
            onClick={isElectron ? onOpenFile : undefined} 
            title={isElectron ? "Open File (Ctrl+O)" : "Open File is only available in desktop version"} 
            icon="📂" 
            label="Open" 
            disabled={!isElectron}
          />
          <Btn
            onClick={isElectron ? onSave : undefined}
            title={isElectron ? "Save (Ctrl+S)" : "Save is only available in desktop version"}
            icon={isSaving ? '…' : '💾'}
            label={isSaving ? 'Saving' : 'Save'}
            disabled={!currentFile || !isElectron}
          />
          <div style={{ width: 1, height: 20, background: '#1f1f32', margin: '0 2px', flexShrink: 0 }} />
          <Btn
            onClick={isElectron ? onRun : undefined}
            title={isElectron ? "Run (Ctrl+Enter)" : "Code execution is only available in desktop version"}
            icon={isRunning ? '⏹' : '▶'}
            label={isRunning ? 'Running' : 'Run'}
            primary
            disabled={!currentFile || isRunning || !isElectron}
          />
          <div style={{ width: 1, height: 20, background: '#1f1f32', margin: '0 2px', flexShrink: 0 }} />
          <Btn
            onClick={() => setAutoSave(v => !v)}
            title={isElectron ? (autoSave ? 'Disable Auto Save' : 'Enable Auto Save') : "Auto Save is only available in desktop version"}
            icon="⚡"
            label="Auto"
            active={autoSave}
            disabled={!isElectron}
          />
          <Btn onClick={onToggleTerminal} title="Toggle Terminal (Ctrl+`)" icon="⬛" label={terminalVisible ? 'Hide' : 'Terminal'} />
          <Btn onClick={onCommandPalette} title="Command Palette (Ctrl+Shift+P)" icon="⌨️" label="Palette" />
          <div style={{ width: 1, height: 20, background: '#1f1f32', margin: '0 2px', flexShrink: 0 }} />
          <Btn onClick={() => setVoiceSearchOpen(true)} title="Voice Search (Open File)" icon="🎙️" label="Voice" />
          <Btn onClick={() => setIsCustomizePanelOpen(true)} title="Customize US IDE" icon="🎨" label="Customize" />
        </div>
      </div>

      {/* ─ Right: Status ─ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, WebkitAppRegion: 'no-drag', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 600, fontFamily: 'monospace', color: '#444466' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e888', boxShadow: '0 0 8px #00e888' }} />
            <span>STABLE</span>
          </div>
          <div style={{ width: 1, height: 14, background: '#1f1f32' }} />
          <span style={{ color: '#555570' }}>US-IDE v1.0</span>
        </div>

        {/* User Profile */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="hidden xl:block text-right">
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 9, color: '#555570', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: user.picture ? `url(${user.picture})` : 'linear-gradient(135deg, #7c6df5, #00d4ff)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: '#fff', border: '2px solid #1a1a28',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title={user.email}
              >
                {!user.picture && (user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U')}
                <div style={{ 
                  position: 'absolute', bottom: -1, right: -1, 
                  width: 8, height: 8, borderRadius: '50%', 
                  background: '#00e888', border: '1px solid #0a0a0f',
                  boxShadow: '0 0 5px #00e888'
                }} />
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 1000,
                  width: 220, background: '#13131e', border: '1px solid #2a2a3d',
                  borderRadius: 12, padding: '10px 0',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
                  animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <div style={{ padding: '4px 16px 10px 16px', borderBottom: '1px solid #2a2a3d', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ 
                        width: 28, height: 28, borderRadius: '50%', 
                        background: user.picture ? `url(${user.picture})` : '#2a2a3d',
                        backgroundSize: 'cover', backgroundPosition: 'center'
                      }} />
                      <div>
                        <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{user.name}</div>
                        <div style={{ color: '#00e888', fontSize: 9, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00e888' }} /> Connected
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div
                    onClick={() => { (onLogout || contextLogout)(); setUserMenuOpen(false); }}
                    style={{
                      padding: '8px 16px', cursor: 'pointer', fontSize: 11, color: '#ff4d6d',
                      display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s',
                      fontWeight: 600
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.08)'; e.currentTarget.style.paddingLeft = '20px' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '16px' }}
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Window Controls */}
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 4 }}>
          <button
            onClick={() => window.api?.minimizeWindow()}
            style={{ ...winBtnStyle, opacity: isElectron ? 1 : 0.3, cursor: isElectron ? 'pointer' : 'not-allowed' }}
            onMouseEnter={e => isElectron && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => isElectron && (e.currentTarget.style.background = 'transparent')}
            title="Minimize"
          >
            <svg width="10" height="10" viewBox="0 0 12 12"><rect x="1" y="5.5" width="10" height="1" fill="#888" /></svg>
          </button>
          <button
            onClick={() => window.api?.maximizeWindow()}
            style={{ ...winBtnStyle, opacity: isElectron ? 1 : 0.3, cursor: isElectron ? 'pointer' : 'not-allowed' }}
            onMouseEnter={e => isElectron && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => isElectron && (e.currentTarget.style.background = 'transparent')}
            title="Maximize"
          >
            <svg width="10" height="10" viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" fill="none" stroke="#888" strokeWidth="1" /></svg>
          </button>
          <button
            onClick={() => window.api?.closeWindow()}
            style={{ ...winBtnStyle, opacity: isElectron ? 1 : 0.3, cursor: isElectron ? 'pointer' : 'not-allowed' }}
            onMouseEnter={e => { if (isElectron) { e.currentTarget.style.background = '#e81123'; e.currentTarget.querySelector('path').setAttribute('fill', '#fff'); } }}
            onMouseLeave={e => { if (isElectron) { e.currentTarget.style.background = 'transparent'; e.currentTarget.querySelector('path').setAttribute('fill', '#888'); } }}
            title="Close"
          >
            <svg width="10" height="10" viewBox="0 0 12 12"><path d="M1 1L11 11M11 1L1 11" stroke="#888" strokeWidth="1.2" /></svg>
          </button>
        </div>
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

const winBtnStyle = {
  width: 46, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s',
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
