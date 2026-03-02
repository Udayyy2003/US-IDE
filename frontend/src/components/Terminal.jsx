import React, { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { io } from 'socket.io-client'
import { useIDE } from '../contexts/IDEContext'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Terminal() {
  const { isRunning, setIsRunning, currentProject, currentFile, editorContent, currentLanguage } = useIDE()
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    // Initialize xterm.js
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
      theme: {
        background: '#0a0a0f',
        foreground: '#e8e8f0',
        cursor: '#7c6df5',
        selectionBackground: 'rgba(124, 109, 245, 0.3)',
      },
      allowProposedApi: true
    })
    
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()
    
    xtermRef.current = term

    // Initialize socket.io
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    socketRef.current = socket

    socket.on('connect', () => {
      term.writeln('\x1b[32mConnected to terminal service\x1b[0m')
    })

    socket.on('terminal_output', (data) => {
      if (data.text) {
        term.write(data.text)
      }
      if (data.type === 'system' || data.type === 'error') {
        setIsRunning(false)
      }
    })

    socket.on('disconnect', () => {
      term.writeln('\x1b[31mDisconnected from terminal service\x1b[0m')
      setIsRunning(false)
    })

    // Handle user input in xterm
    term.onData((data) => {
      if (socket.connected) {
        socket.emit('terminal_input', { text: data })
      }
    })

    // Handle resize
    const handleResize = () => fitAddon.fit()
    window.addEventListener('resize', handleResize)

    return () => {
      socket.disconnect()
      term.dispose()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Start execution when isRunning changes from false to true via IDEContext
  useEffect(() => {
    if (isRunning && socketRef.current && currentProject && currentFile) {
      const token = localStorage.getItem('us_ide_token')
      xtermRef.current?.clear()
      xtermRef.current?.writeln(`\x1b[34m$ run ${currentFile}\x1b[0m`)
      
      socketRef.current.emit('start_terminal', {
        token,
        projectName: currentProject.name,
        fileName: currentFile,
        code: editorContent,
        language: currentLanguage
      })
    }
  }, [isRunning])

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0f' }}>
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border-subtle" style={{ minHeight: 32 }}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Interactive Terminal</span>
          {isRunning && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span className="text-xs text-accent-green font-mono">Running...</span>
            </div>
          )}
        </div>
        <button
          onClick={() => xtermRef.current?.clear()}
          className="text-xs text-text-muted hover:text-text-primary transition-colors font-mono"
        >
          Clear
        </button>
      </div>

      {/* Terminal container for xterm.js */}
      <div ref={terminalRef} className="flex-1 overflow-hidden p-2" />
    </div>
  )
}
