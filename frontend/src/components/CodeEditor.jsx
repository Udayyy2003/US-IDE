import React, { useRef, useCallback, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useTabs } from '../contexts/TabContext'
import { useEditor } from '../contexts/EditorContext'
import { useSettings } from '../contexts/SettingsContext'

// Map our internal language names to Monaco language IDs
const MONACO_LANG = {
  python: 'python', c: 'c', cpp: 'cpp', java: 'java',
  javascript: 'javascript', typescript: 'typescript',
  html: 'html', css: 'css', json: 'json', markdown: 'markdown',
  xml: 'xml', yaml: 'yaml', plaintext: 'plaintext',
}

// Custom dark theme matching US-IDE color palette
const USID_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '555570', fontStyle: 'italic' },
    { token: 'keyword', foreground: '8b80ff', fontStyle: 'bold' },
    { token: 'string', foreground: '00e888' },
    { token: 'number', foreground: 'ffd60a' },
    { token: 'type', foreground: '00d4ff' },
    { token: 'function', foreground: 'ae9fff' },
    { token: 'variable', foreground: 'e8e8f0' },
    { token: 'constant', foreground: 'ff9a3c' },
    { token: 'operator', foreground: 'c8c8d8' },
    { token: 'class', foreground: '00d4ff' },
  ],
  colors: {
    'editor.background': '#0d0d18',
    'editor.foreground': '#e8e8f0',
    'editor.lineHighlightBackground': '#15152a',
    'editor.selectionBackground': '#7c6df540',
    'editor.selectionHighlightBackground': '#7c6df520',
    'editorCursor.foreground': '#8b80ff',
    'editorLineNumber.foreground': '#2a2a4a',
    'editorLineNumber.activeForeground': '#7c6df5',
    'editorGutter.background': '#0d0d18',
    'editorIndentGuide.background1': '#1f1f32',
    'editorBracketMatch.background': '#7c6df530',
    'editorBracketMatch.border': '#7c6df5',
    'editor.findMatchBackground': '#7c6df540',
    'scrollbarSlider.background': '#2a2a4a60',
    'scrollbarSlider.hoverBackground': '#7c6df540',
    'minimap.background': '#0a0a0f',
    'editorWidget.background': '#1a1a28',
    'editorWidget.border': '#2a2a3d',
    'input.background': '#0a0a0f',
    'input.border': '#2a2a3d',
    'focusBorder': '#7c6df5',
  },
}

export default function CodeEditor({ onSave, value, language, onChange }) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  
  const { activeTabIndex, closeTab } = useTabs()
  const { currentFile } = useEditor()
  const { settings } = useSettings()

  const monacoLanguage = MONACO_LANG[language] || 'plaintext'

  // Ref to track latest state for Monaco commands
  const stateRef = useRef({ activeTabIndex, closeTab })
  stateRef.current = { activeTabIndex, closeTab }

  const getMonacoTheme = (theme) => { 
    switch(theme) { 
      case "light": 
        return "vs"; 
      case "dark": 
        return "vs-dark"; 
      case "dracula": 
        return "dracula"; 
      case "monokai": 
        return "monokai"; 
      default: 
        return "us-ide-dark"; 
    } 
  }; 

  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Define custom themes
    monaco.editor.defineTheme('us-ide-dark', USID_THEME)
    monaco.editor.defineTheme("dracula", { 
      base: "vs-dark", 
      inherit: true, 
      rules: [], 
      colors: { 
        "editor.background": "#282a36", 
        "editor.foreground": "#f8f8f2" 
      } 
    }); 
    monaco.editor.defineTheme("monokai", { 
      base: "vs-dark", 
      inherit: true, 
      rules: [], 
      colors: { 
        "editor.background": "#272822", 
        "editor.foreground": "#f8f8f2" 
      } 
    }); 

    // Apply initial theme
    monaco.editor.setTheme(getMonacoTheme(settings.theme));

    // ─ Ctrl+S → Save ───────────
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.()
    })

    // ─ Ctrl+W → Close Tab ───────
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => {
      const { activeTabIndex } = stateRef.current
      if (activeTabIndex !== -1) {
        window.dispatchEvent(new CustomEvent('close-tab', { detail: { index: activeTabIndex } }))
      }
    })

    // ─ Alt+Z → Word Wrap toggle ─
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, () => {
      const current = editor.getOption(monaco.editor.EditorOption.wordWrap)
      editor.updateOptions({ wordWrap: current === 'on' ? 'off' : 'on' })
    })
  }, [onSave, settings.theme]); // Added settings.theme to dependencies

  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setTheme(getMonacoTheme(settings.theme));
      editorRef.current.updateOptions({
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        lineNumbers: settings.lineNumbers ? 'on' : 'off',
        wordWrap: settings.wordWrap ? 'on' : 'off',
      });
    }
  }, [settings.theme, settings.fontFamily, settings.fontSize, settings.lineNumbers, settings.wordWrap]);

  const handleChange = useCallback((val) => {
    onChange?.(val)
  }, [onChange])

  const loadingIndicator = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', background: '#0d0d18', gap: '16px'
    }}>
      <div style={{
        width: '32px', height: '32px', border: '3px solid rgba(124,109,245,0.1)',
        borderTopColor: '#7c6df5', borderRadius: '50%', animation: 'spin 1s linear infinite'
      }} />
      <div style={{ color: '#555570', fontSize: '13px', fontWeight: 500 }}>Initializing editor...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d18' }}>
      {currentFile ? (
        <Editor
          height="100%"
          language={monacoLanguage}
          value={value}
          theme={getMonacoTheme(settings.theme)}
          onChange={handleChange}
          onMount={handleMount}
          loading={loadingIndicator}
          options={{
            fontSize: settings.fontSize,
            fontFamily: settings.fontFamily,
            lineNumbers: settings.lineNumbers ? 'on' : 'off',
            wordWrap: settings.wordWrap ? 'on' : 'off',
            minimap: { enabled: settings.layout !== 'focus' },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            fontLigatures: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            tabSize: 4,
          }}
        />
      ) : (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: '#555570', fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>{'</>'}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#333355', marginBottom: 8 }}>No file open</div>
          <div style={{ fontSize: 12, color: '#2a2a40', maxWidth: 240, textAlign: 'center', lineHeight: 1.6 }}>
            Select a file from the explorer, or press <kbd style={{ background: '#1a1a28', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>Ctrl+O</kbd> to open a file.
          </div>
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['Ctrl+O', 'Open File'], ['Ctrl+Shift+O', 'Open Folder'], ['Ctrl+N', 'New File'], ['Ctrl+S', 'Save'], ['Ctrl+Enter', 'Run'], ['Ctrl+`', 'Terminal']].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: '#333355' }}>
                <kbd style={{ background: '#1a1a28', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: 10, color: '#555570' }}>{key}</kbd>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}