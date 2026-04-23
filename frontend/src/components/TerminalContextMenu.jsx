import React, { useEffect, useRef, useState } from 'react'
import { 
  MoreVertical, Edit2, Trash2, Split, Maximize2, Copy, Palette, Type,
  Terminal as TerminalIcon, Cpu, Database, Globe, Activity, Layout,
  Check, X
} from 'lucide-react'
import { showToast, useIDE } from '../contexts/IDEContext'

export default function TerminalContextMenu({ x, y, onClose, onRename, onKill, onUpdateStyle, onMaximize, onCreateTerminal, onDuplicate, terminal }) {
  const { isTerminalMaximized } = useIDE()
  const menuRef = useRef(null)
  const [showIcons, setShowIcons] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(terminal.title)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const MenuItem = ({ icon: Icon, label, onClick, shortcut, danger, hasSubmenu, staysOpen, children }) => (
    <div
      onClick={(e) => {
        e.stopPropagation()
        if (hasSubmenu) {
          setShowIcons(!showIcons)
        } else if (children) {
          // Do nothing, let children handle it
        } else {
          onClick?.()
          if (!hasSubmenu && !children && !staysOpen) onClose()
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 12px',
        cursor: 'pointer',
        fontSize: '12px',
        color: danger ? '#ff4d6d' : '#e8e8f0',
        transition: 'background 0.1s',
        position: 'relative',
        borderRadius: '4px'
      }}
      className="context-menu-item"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon size={14} style={{ opacity: 0.7 }} />
          <span>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {shortcut && <span style={{ fontSize: '10px', opacity: 0.4 }}>{shortcut}</span>}
          {hasSubmenu && <MoreVertical size={12} style={{ opacity: 0.4 }} />}
        </div>
      </div>
      {children}
    </div>
  )

  const icons = [
    { name: 'terminal', icon: TerminalIcon },
    { name: 'cpu', icon: Cpu },
    { name: 'database', icon: Database },
    { name: 'globe', icon: Globe },
    { name: 'activity', icon: Activity },
    { name: 'layout', icon: Layout },
  ]

  const handleCopyName = async () => {
    try {
      await window.api.copyToClipboard(terminal.title);
      showToast("Copied terminal name");
      onClose(); // Explicitly close after copy
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      showToast("Failed to copy terminal name");
    }
  };

  const handleRename = () => {
    if (newName.trim()) {
      onRename(terminal.id, newName.trim());
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: Math.min(y, window.innerHeight - 350),
        left: Math.min(x, window.innerWidth - 220),
        zIndex: 9999,
        background: '#1a1a28',
        border: '1px solid #2a2a3d',
        borderRadius: '8px',
        padding: '4px',
        minWidth: '220px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        userSelect: 'none',
        backdropFilter: 'blur(10px)'
      }}
    >
      <MenuItem icon={Maximize2} label={isTerminalMaximized ? "Restore Size" : "Maximize Panel Size"} onClick={onMaximize} />
      <div style={{ height: '1px', background: '#2a2a3d', margin: '4px 0' }} />
      
      <MenuItem icon={Edit2} label="Rename Terminal" onClick={() => setIsRenaming(!isRenaming)} staysOpen={true}>
        {isRenaming && (
          <div onClick={e => e.stopPropagation()} style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              style={{
                flex: 1,
                background: '#0d0d18',
                border: '1px solid #7c6df5',
                color: '#e8e8f0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                outline: 'none'
              }}
            />
            <button onClick={handleRename} style={{ background: '#7c6df5', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: 'white' }}><Check size={12} /></button>
            <button onClick={() => setIsRenaming(false)} style={{ background: '#2a2a3d', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: 'white' }}><X size={12} /></button>
          </div>
        )}
      </MenuItem>

      <MenuItem icon={Type} label="Change Icon" hasSubmenu />
      
      {showIcons && (
        <div onClick={e => e.stopPropagation()} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          padding: '8px',
          background: '#141420',
          border: '1px solid #2a2a3d',
          borderRadius: '4px',
          margin: '0 8px 8px 8px'
        }}>
          {icons.map(({ name, icon: Icon }) => (
            <div
              key={name}
              onClick={() => {
                onUpdateStyle(terminal.id, { icon: name })
                onClose()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                cursor: 'pointer',
                borderRadius: '4px',
                background: terminal.icon === name ? '#2a2a3d' : 'transparent',
                border: '1px solid ' + (terminal.icon === name ? '#7c6df5' : 'transparent')
              }}
              className="icon-picker-item"
            >
              <Icon size={16} />
            </div>
          ))}
        </div>
      )}

      <div style={{ height: '1px', background: '#2a2a3d', margin: '4px 0' }} />
      <MenuItem icon={Split} label="Duplicate Terminal" onClick={() => onDuplicate(terminal)} />
      <MenuItem icon={Copy} label="Copy Name" onClick={handleCopyName} />
      <MenuItem icon={Trash2} label="Kill Terminal" shortcut="Delete" danger onClick={() => onKill(terminal.id)} />

      <style>{`
        .context-menu-item:hover {
          background: rgba(255,255,255,0.04);
        }
        .icon-picker-item:hover {
          background: rgba(255,255,255,0.08);
        }
      `}</style>
    </div>
  )
}
