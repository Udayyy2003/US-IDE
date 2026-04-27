import React, { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { SerializeAddon } from 'xterm-addon-serialize'
import 'xterm/css/xterm.css'
import { 
  Plus, X, ChevronDown, Trash2, MoreHorizontal, Maximize2,
  Terminal as TerminalIcon, Cpu, Database, Globe, Activity, Layout
} from 'lucide-react'
import { useIDE } from '../contexts/IDEContext'
import { useSettings } from '../contexts/SettingsContext'
import TerminalContextMenu from './TerminalContextMenu'

const ICON_MAP = {
  terminal: TerminalIcon,
  cpu: Cpu,
  database: Database,
  globe: Globe,
  activity: Activity,
  layout: Layout
}

function TerminalInstance({ id, isActive, terminalVisible, terminalHeight, initialContent }) {
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const fitAddonRef = useRef(null)
  const serializeAddonRef = useRef(null)
  const isOpenedRef = useRef(false)
  const resizeObserverRef = useRef(null)
  const { activeTerminalId, setActiveTerminalId } = useIDE()
  const { settings } = useSettings()

  const isFocused = activeTerminalId === id;

  // 1. Core Terminal Initialization (Once per ID)
  useEffect(() => {
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      theme: {
        background: '#0d0d18', foreground: '#e8e8f0', cursor: settings.accentColor,
        selectionBackground: `${settings.accentColor}40`, black: '#1a1a28', red: '#ff4d6d',
        green: '#00e888', yellow: '#ffd60a', blue: '#00d4ff',
        magenta: '#ae9fff', cyan: '#00d4ff', white: '#e8e8f0',
      },
      allowProposedApi: true,
      convertEol: true,
      scrollback: 5000,
      rows: 20,
    })

    const fitAddon = new FitAddon()
    const serializeAddon = new SerializeAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(serializeAddon)
    
    xtermRef.current = term
    fitAddonRef.current = fitAddon
    serializeAddonRef.current = serializeAddon

    window.terminalInstances = window.terminalInstances || {}
    window.terminalInstances[id] = term

    if (initialContent) {
      term.write(initialContent)
      term.write('\r\n\x1b[33m--- Duplicated Session ---\x1b[0m\r\n\r\n')
    }

    let cleanupData = () => {}
    let cleanupExit = () => {}

    if (window.api?.onTerminalData) {
      cleanupData = window.api.onTerminalData(id, (data) => {
        if (xtermRef.current) xtermRef.current.write(data)
      })
      if (window.api.onTerminalExit) {
        cleanupExit = window.api.onTerminalExit(id, ({ exitCode }) => {
          if (xtermRef.current) xtermRef.current.write(`\r\n\x1b[33m[Process exited with code ${exitCode}]\x1b[0m\r\n`)
        })
      }
      term.onData(data => window.api.writeTerminal(id, data))
      term.onResize(({ cols, rows }) => window.api.resizeTerminal(id, cols, rows))
      term.onBinary(() => setActiveTerminalId(id))
      term.onKey(() => setActiveTerminalId(id))
      term.onSelectionChange(() => setActiveTerminalId(id))
    }

    return () => {
      cleanupData()
      cleanupExit()
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
      delete window.terminalInstances?.[id]
      term.dispose()
      isOpenedRef.current = false
    }
  }, [id])

  // 2. Handle Opening and Fitting with ResizeObserver
  useEffect(() => {
    if (!terminalRef.current || !xtermRef.current) return

    const safeFit = () => {
      if (!isActive || !terminalVisible || !xtermRef.current || !fitAddonRef.current || !isOpenedRef.current) return
      
      // Check if terminal is disposed (xterm.js internal check)
      if (xtermRef.current._disposed) return;

      try {
        const container = terminalRef.current
        if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
          // Extra safety check: ensure the terminal has a core renderer initialized
          if (!xtermRef.current._core?._renderService) return;
          
          fitAddonRef.current.fit()
          const dims = fitAddonRef.current.proposeDimensions()
          if (dims && dims.cols && dims.rows) {
            window.api?.resizeTerminal(id, dims.cols, dims.rows)
          }
        }
      } catch (e) {
        // Silent catch for xterm internal resize races
      }
    }

    // Initialize ResizeObserver
    if (!resizeObserverRef.current && terminalRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0 && isActive && terminalVisible) {
            requestAnimationFrame(() => safeFit())
          }
        }
      })
      resizeObserverRef.current.observe(terminalRef.current)
    }

    // Attempt to open if visible
    if (!isOpenedRef.current && isActive && terminalVisible && xtermRef.current) {
      const container = terminalRef.current
      if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
        try {
          // Final safety check before opening
          if (!xtermRef.current._disposed) {
            xtermRef.current.open(container)
            isOpenedRef.current = true
            // Use a slightly longer delay for the first fit to ensure internal character measurement is done
            setTimeout(safeFit, 200)
          }
        } catch (e) {
          console.error('[Terminal Open Error]', e)
        }
      }
    }

    // Handle focus when active
    if (isActive && terminalVisible && isOpenedRef.current && isFocused) {
      setTimeout(() => xtermRef.current?.focus(), 150)
    }

    return () => {
      // Observer cleaned up in core useEffect
    }
  }, [isActive, terminalVisible, terminalHeight, isFocused, id])

  return (
    <div
      ref={terminalRef}
      className={`terminal-instance-container ${isFocused ? 'focused' : ''}`}
      onClick={() => setActiveTerminalId(id)}
      style={{
        display: isActive ? 'block' : 'none',
        height: '100%',
        width: '100%',
        padding: '4px',
        background: '#0d0d18',
        overflow: 'hidden',
        border: isFocused ? `1px solid ${settings.accentColor}44` : '1px solid transparent',
        transition: 'border 0.2s',
        position: 'relative'
      }}
    />
  )
}

export default function Terminal({ terminalHeight, onMaximize, onRestore }) {
  const {
    terminals,
    activeTerminalId,
    setActiveTerminalId,
    createTerminal,
    killTerminal,
    renameTerminal,
    updateTerminalStyle,
    duplicateTerminal,
    terminalVisible,
    setTerminalVisible,
    isTerminalMaximized,
    setIsTerminalMaximized
  } = useIDE()

  const { settings } = useSettings()

  const [contextMenu, setContextMenu] = useState(null)

  const handleDuplicate = (terminal) => {
    let content = ''
    try {
      const term = window.terminalInstances?.[terminal.id]
      if (term) {
        // Try to get the serialize addon from the term if possible
        // Since we load it via term.loadAddon(serializeAddon), it should be there.
        // xterm.js doesn't provide a direct way to get an addon by type, 
        // so we'll rely on our serializeAddonRef if we had access, 
        // but since we are in a different component, we can use the term's buffer.
        
        // Actually, we can just use a global serialize helper or access it from the term.
        // For now, let's try to get the buffer content directly if serialize isn't easily accessible.
        // Wait, I can just use the serialize addon directly if I store it too.
        
        // A better way: serialize the buffer using the addon we just added.
        // If we can't find the addon instance, we fallback to plain text.
        const serializeAddon = term._addons?.find(a => a instanceof SerializeAddon);
        if (serializeAddon) {
          content = serializeAddon.serialize();
        } else {
          // Fallback to plain text if addon not found
          const buffer = term.buffer.active;
          for (let i = 0; i < buffer.length; i++) {
            const line = buffer.getLine(i);
            if (line) content += line.translateToString() + '\r\n';
          }
        }
      }
    } catch (e) {
      console.error('Duplication serialization failed:', e);
    }
    duplicateTerminal(terminal, content)
    setContextMenu(null)
  }

  const handleContextMenu = (e, terminal) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      terminal
    })
  }

  const handleToggleMaximize = () => {
    if (isTerminalMaximized) {
      onRestore?.()
    } else {
      onMaximize?.()
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: '#0d0d18',
      borderTop: isTerminalMaximized ? 'none' : '1px solid #2a2a3d'
    }}>
      {/* Terminal Tabs Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#1a1a28',
        borderBottom: '1px solid #2a2a3d',
        padding: '0 8px',
        userSelect: 'none',
        height: '35px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', overflowX: 'auto', gap: '2px' }}>
          {terminals.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveTerminalId(t.id)}
              onContextMenu={(e) => handleContextMenu(e, t)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 12px',
                height: '100%',
                fontSize: '11px',
                fontWeight: 600,
                color: activeTerminalId === t.id ? '#e8e8f0' : '#555570',
                background: activeTerminalId === t.id ? '#0d0d18' : 'transparent',
                borderTop: activeTerminalId === t.id ? `2px solid ${settings.accentColor}` : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              className="terminal-tab"
            >
              {React.createElement(ICON_MAP[t.icon] || TerminalIcon, { 
                size: 12, 
                style: { 
                  opacity: activeTerminalId === t.id ? 1 : 0.6 
                } 
              })}
              <span>{t.title}</span>
              <div className="tab-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MoreHorizontal
                  size={12}
                  className="tab-more-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleContextMenu(e, t)
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.2s' }}
                />
                <X
                  size={12}
                  style={{ opacity: 0.6 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    killTerminal(t.id)
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                />
              </div>
            </div>
          ))}
          <div
            onClick={() => createTerminal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              height: '100%',
              cursor: 'pointer',
              color: '#555570'
            }}
            title="New Terminal"
          >
            <Plus size={16} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#555570'} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#555570', paddingRight: '8px' }}>
          <div
            onClick={handleToggleMaximize}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title={isTerminalMaximized ? "Restore" : "Maximize"}
          >
            <Maximize2 size={14} style={{ color: isTerminalMaximized ? settings.accentColor : 'inherit' }} />
          </div>
          <div
            onClick={() => setTerminalVisible(false)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Minimize"
          >
            <ChevronDown size={16} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#555570'} />
          </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {terminals.map(t => (
          <TerminalInstance
            key={t.id}
            id={t.id}
            isActive={activeTerminalId === t.id}
            terminalVisible={terminalVisible}
            terminalHeight={terminalHeight}
            initialContent={t.initialContent}
          />
        ))}
      </div>

      {contextMenu && (
        <TerminalContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          terminal={contextMenu.terminal}
          onClose={() => setContextMenu(null)}
          onRename={renameTerminal}
          onKill={killTerminal}
          onUpdateStyle={updateTerminalStyle}
          onMaximize={handleToggleMaximize}
          onCreateTerminal={createTerminal}
          onDuplicate={handleDuplicate}
        />
      )}

      <style>{`
        .terminal-tab:hover .tab-more-btn {
          opacity: 0.6 !important;
        }
        .tab-more-btn:hover {
          opacity: 1 !important;
          color: #fff;
        }
        .terminal-instance-container.focused {
          border-color: ${settings.accentColor}88 !important;
          box-shadow: inset 0 0 10px ${settings.accentColor}11;
        }
        .terminal-instance-container .xterm-viewport {
          width: 100% !important;
        }
        /* Custom xterm scrollbar */
        .xterm-viewport::-webkit-scrollbar {
          width: 10px;
        }
        .xterm-viewport::-webkit-scrollbar-track {
          background: #0d0d18;
        }
        .xterm-viewport::-webkit-scrollbar-thumb {
          background: #2a2a3d;
          border-radius: 5px;
          border: 2px solid #0d0d18;
        }
        .xterm-viewport::-webkit-scrollbar-thumb:hover {
          background: #3f3f5a;
        }
      `}</style>
    </div>
  )
}
