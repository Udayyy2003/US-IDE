import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useIDE } from '../contexts/IDEContext'

const LANG_LABELS = {
  python: { icon: '🐍', label: 'Python' },
  c:      { icon: '⚙️', label: 'C' },
  cpp:    { icon: '⚡', label: 'C++' },
  java:   { icon: '☕', label: 'Java' },
}

export default function TopBar({ onSave, onRun, onNewProject, onOpenProject }) {
  const { user, logout } = useAuth()
  const { currentProject, currentLanguage, isRunning, isSaving } = useIDE()
  const langInfo = LANG_LABELS[currentLanguage] || { icon: '📄', label: currentLanguage }

  return (
    <div className="flex items-center justify-between px-4 h-12 border-b border-border-subtle shrink-0" style={{ background: '#0a0a0f' }}>
      
      {/* Left: Logo + Project */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c6df5, #00d4ff)' }}>
            <span className="text-white font-bold text-xs">US</span>
          </div>
          <span className="text-text-primary font-semibold text-sm tracking-tight hidden sm:block">US-IDE</span>
        </div>

        <div className="w-px h-5 bg-border-subtle" />

        {/* Project selector */}
        <button
          onClick={onOpenProject}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-bg-hover"
        >
          <span className="text-xs">{langInfo.icon}</span>
          <span className="text-text-primary font-medium truncate max-w-32">{currentProject?.name || 'Open Project'}</span>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-text-muted">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Language badge */}
        {currentProject && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono" style={{ background: 'rgba(124, 109, 245, 0.1)', color: '#9d8fff' }}>
            {langInfo.label}
          </div>
        )}
      </div>

      {/* Center: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={isSaving || !currentProject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
          style={{ background: 'rgba(124, 109, 245, 0.1)', border: '1px solid rgba(124, 109, 245, 0.2)', color: '#9d8fff' }}
        >
          {isSaving ? (
            <><div className="spinner" style={{ width: 12, height: 12 }} /> Saving</>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M13 11v2H3v-2M8 3v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Save
            </>
          )}
        </button>

        <button
          onClick={onRun}
          disabled={isRunning || !currentProject}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={{ background: isRunning ? '#2a2a3d' : 'linear-gradient(135deg, #00ff94, #00d4ff)', color: isRunning ? '#555570' : '#0a0a0f' }}
        >
          {isRunning ? (
            <><div className="spinner" style={{ width: 12, height: 12, borderTopColor: '#7c6df5' }} /> Running</>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M5 3l9 5-9 5V3z" fill="currentColor"/>
              </svg>
              Run
            </>
          )}
        </button>

        <button
          onClick={onNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ border: '1px solid #2a2a3d', color: '#8888a8' }}
          title="New Project"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          New
        </button>
      </div>

      {/* Right: User */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-text-primary text-xs font-medium truncate max-w-24">{user?.name}</span>
          <span className="text-text-muted text-xs truncate max-w-24">{user?.email}</span>
        </div>
        <div className="relative group">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-8 h-8 rounded-full cursor-pointer"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer" style={{ background: 'rgba(124, 109, 245, 0.2)', color: '#9d8fff' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border-default opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 overflow-hidden" style={{ background: '#13131d' }}>
            <div className="p-3 border-b border-border-subtle">
              <div className="text-text-primary text-xs font-medium">{user?.name}</div>
              <div className="text-text-muted text-xs truncate">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-accent-red hover:bg-bg-hover transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M6 3H3v10h3M10 5l3 3-3 3M6 8h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
