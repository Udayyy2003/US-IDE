import React, { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { useIDE } from '../contexts/IDEContext'

export default function Terminal() {
  const { isRunning, setIsRunning, currentProject, currentFile, currentLanguage } = useIDE()
  const termRef = useRef(null)     // DOM container
  const xtermRef = useRef(null)     // XTerm instance
  const fitRef = useRef(null)     // FitAddon instance

  // ─── Initialize xterm once ───────────────────
  useEffect(() => {
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      lineHeight: 1.4,
      letterSpacing: 0.5,
      allowProposedApi: true,
      scrollback: 2000,
      theme: {
        background: '#080810',
        foreground: '#d8d8e8',
        cursor: '#8b80ff',
        selectionBackground: 'rgba(124,109,245,0.3)',
        black: '#1a1a28',
        red: '#ff4d6d',
        green: '#00e888',
        yellow: '#ffd60a',
        blue: '#7c6df5',
        magenta: '#d66aff',
        cyan: '#00d4ff',
        white: '#d8d8e8',
        brightBlack: '#555570',
        brightRed: '#ff7090',
        brightGreen: '#00ffaa',
        brightYellow: '#ffe55c',
        brightBlue: '#a090ff',
        brightMagenta: '#e090ff',
        brightCyan: '#60e8ff',
        brightWhite: '#ffffff',
      },
    })

    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(termRef.current)
    fit.fit()

    xtermRef.current = term
    fitRef.current = fit

    // ─── Handle keyboard input ─────────────────
    term.onData((data) => {
      window.api?.sendTerminalInput(data)
      
      // Local Echo: Write the input back to the terminal so the user can see what they're typing.
      // This is necessary because we aren't using a PTY (Pseudo-Terminal) on the backend.
      if (data === '\r') {
        term.write('\r\n')
      } else if (data === '\x7f') { // Backspace
        // Standard terminal backspace sequence: back, space, back
        term.write('\b \b')
      } else if (data >= ' ' || data === '\t') {
        term.write(data)
      }
    })

    // Welcome message
    term.writeln('\x1b[36m US-IDE Terminal  \x1b[0m  \x1b[90mv1.0\x1b[0m')
    term.writeln('\x1b[90m─────────────────────────────────────────\x1b[0m')
    term.writeln('')

    // ─── Listen for output from Electron ───────
    const removeListener = window.api?.onTerminalOutput((data) => {
      if (!xtermRef.current) return
      if (data.text) {
        xtermRef.current.write(data.text)
      }
      if (data.type === 'done') {
        setIsRunning(false)
      }
    })

    // ─── Resize handler ─────────────────────────
    const safeFit = () => {
      const el = termRef.current
      if (!el) return
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (w > 0 && h > 0) {
        try { fitRef.current?.fit() } catch (_) {}
      }
    }
    const handleResize = () => safeFit()
    const ro = new ResizeObserver(handleResize)
    if (termRef.current) ro.observe(termRef.current)
    window.addEventListener('resize', handleResize)

    return () => {
      removeListener?.()
      ro.disconnect()
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [])

  // ─── Trigger execution ───────────────────────
  useEffect(() => {
    if (!isRunning || !currentFile) return

    const projectPath = currentProject?.path
      || currentFile.substring(0, Math.max(
        currentFile.lastIndexOf('\\'),
        currentFile.lastIndexOf('/'),
      ))

    window.api?.executeCode({ filePath: currentFile, projectPath, language: currentLanguage })

    // Re-fit after terminal becomes visible
    setTimeout(() => {
      const el = termRef.current
      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
        try { fitRef.current?.fit() } catch (_) {}
      }
    }, 100)
  }, [isRunning])

  const handleClear = () => {
    xtermRef.current?.clear()
    xtermRef.current?.reset()
    xtermRef.current?.writeln('\x1b[90mTerminal cleared.\x1b[0m')
    xtermRef.current?.writeln('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#080810' }}>
      {/* Terminal header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', height: 32, borderBottom: '1px solid #1a1a28',
        flexShrink: 0, background: '#0d0d18',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#555570', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            Terminal
          </span>
          {isRunning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e888', animation: 'pulse 1s infinite' }} />
              <span style={{ fontSize: 11, color: '#00e888', fontFamily: 'monospace' }}>Running…</span>
            </div>
          )}
        </div>
        <button
          onClick={handleClear}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: '#555570', fontFamily: 'monospace',
            padding: '2px 8px', borderRadius: 4,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e8e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#555570'; e.currentTarget.style.background = 'none' }}
        >
          Clear
        </button>
      </div>

      {/* xterm container */}
      <div ref={termRef} style={{ flex: 1, overflow: 'hidden', padding: '4px 0' }} />
    </div>
  )
}
