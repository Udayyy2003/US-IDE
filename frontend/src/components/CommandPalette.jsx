import React, { useState, useEffect, useRef } from 'react'
import { useEditor } from '../contexts/EditorContext'

const ALL_COMMANDS = (actions) => [
    { id: 'save', label: 'File: Save', icon: '💾', shortcut: 'Ctrl+S', action: actions.onSave },
    { id: 'open-file', label: 'File: Open File', icon: '📂', shortcut: 'Ctrl+O', action: actions.onOpenFile },
    { id: 'open-folder', label: 'File: Open Folder', icon: '📁', shortcut: 'Ctrl+Shift+O', action: actions.onOpenFolder },
    { id: 'new-file', label: 'File: New File', icon: '📄', shortcut: 'Ctrl+N', action: actions.onNewFile },
    { id: 'run', label: 'Run: Run Active File', icon: '▶', shortcut: 'Ctrl+Enter', action: actions.onRun },
    { id: 'toggle-term', label: 'View: Toggle Terminal', icon: '⬛', shortcut: 'Ctrl+`', action: actions.onToggleTerminal },
    { id: 'autosave', label: 'Settings: Toggle Auto Save', icon: '⚡', action: actions.onToggleAutoSave },
]

export default function CommandPalette({ onClose, onSave, onRun, onOpenFile, onOpenFolder, onNewFile, onToggleTerminal }) {
    const { setAutoSave } = useEditor()
    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState(0)
    const inputRef = useRef(null)

    const commands = ALL_COMMANDS({
        onSave, onRun, onOpenFile, onOpenFolder, onNewFile, onToggleTerminal,
        onToggleAutoSave: () => setAutoSave(v => !v),
    })

    const filtered = query.trim()
        ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
        : commands

    useEffect(() => {
        inputRef.current?.focus()
        setSelected(0)
    }, [])

    useEffect(() => { setSelected(0) }, [query])

    const run = (cmd) => {
        cmd.action?.()
        onClose()
    }

    const handleKey = (e) => {
        if (e.key === 'Escape') { onClose(); return }
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
        if (e.key === 'Enter' && filtered[selected]) { run(filtered[selected]) }
    }

    return (
        <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 580, background: '#13131e', border: '1px solid #2a2a40', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', fontFamily: 'Inter, system-ui, sans-serif' }}
            >
                {/* Search input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #1f1f2e' }}>
                    <span style={{ color: '#555570', fontSize: 14 }}>⌨️</span>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Type a command..."
                        style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            color: '#e8e8f0', fontSize: 14, fontFamily: 'inherit',
                            caretColor: '#7c6df5',
                        }}
                    />
                    <kbd style={{ fontSize: 10, color: '#333355', background: '#0a0a0f', padding: '2px 6px', borderRadius: 4 }}>ESC</kbd>
                </div>

                {/* Command list */}
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#555570', fontSize: 13 }}>No commands found</div>
                    ) : (
                        filtered.map((cmd, i) => (
                            <div
                                key={cmd.id}
                                onClick={() => run(cmd)}
                                onMouseEnter={() => setSelected(i)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '9px 16px', cursor: 'pointer',
                                    background: i === selected ? 'rgba(124,109,245,0.12)' : 'transparent',
                                    borderLeft: i === selected ? '2px solid #7c6df5' : '2px solid transparent',
                                    transition: 'background 0.1s',
                                }}
                            >
                                <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{cmd.icon}</span>
                                <span style={{ flex: 1, fontSize: 13, color: i === selected ? '#e8e8f0' : '#aaaacc' }}>{cmd.label}</span>
                                {cmd.shortcut && (
                                    <kbd style={{ fontSize: 10, color: '#555570', background: '#0a0a0f', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                                        {cmd.shortcut}
                                    </kbd>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
