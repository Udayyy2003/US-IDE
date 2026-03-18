import React from 'react'
import { useIDE } from '../contexts/IDEContext'

const LANG_ICONS = {
  python: '🐍', c: '⚙️', cpp: '⚡', java: '☕',
  javascript: '🟡', typescript: '🔷', html: '🌐', css: '🎨',
  json: '📋', markdown: '📝', plaintext: '📄',
}

export default function FileTabs() {
  const {
    openFiles, currentFile,
    setCurrentFile, setCurrentLanguage, setEditorContent,
    closeFileTab,
  } = useIDE()

  if (openFiles.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      background: '#0a0a0f',
      borderBottom: '1px solid #1f1f2e',
      overflowX: 'auto',
      flexShrink: 0,
      height: 36,
    }}
      className="no-scrollbar"
    >
      {openFiles.map(file => {
        const isActive = currentFile === file.path
        return (
          <div
            key={file.path}
            title={file.path}
            onClick={() => {
              setCurrentFile(file.path)
              setCurrentLanguage(file.language)
              setEditorContent(file.content)
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 10px 0 12px',
              minWidth: 110,
              maxWidth: 200,
              height: '100%',
              cursor: 'pointer',
              background: isActive ? '#1a1a28' : 'transparent',
              borderRight: '1px solid #1f1f2e',
              flexShrink: 0,
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >
            {/* Active tab bottom indicator */}
            {isActive && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 2, background: '#7c6df5',
              }} />
            )}

            {/* Icon */}
            <span style={{ fontSize: 12 }}>{LANG_ICONS[file.language] || '📄'}</span>

            {/* File name */}
            <span style={{
              fontSize: 12,
              color: isActive ? '#e8e8f0' : '#777798',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {file.name}
            </span>

            {/* Unsaved dot */}
            {file.unsaved && (
              <span style={{ color: '#7c6df5', fontSize: 14, lineHeight: 1 }} title="Unsaved changes">●</span>
            )}

            {/* Close button */}
            <button
              onClick={(e) => { e.stopPropagation(); closeFileTab(file.path) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#555570', fontSize: 14, lineHeight: 1,
                padding: '1px 2px', borderRadius: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e8e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555570'; e.currentTarget.style.background = 'none' }}
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
