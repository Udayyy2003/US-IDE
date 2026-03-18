import React, { useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { useIDE } from '../contexts/IDEContext'

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

export default function CodeEditor({ onSave }) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const {
    editorContent, currentLanguage, currentFile,
    openFiles, handleEditorChange,
  } = useIDE()

  const language = MONACO_LANG[currentLanguage] || 'plaintext'

  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Register and apply custom theme
    monaco.editor.defineTheme('us-ide-dark', USID_THEME)
    monaco.editor.setTheme('us-ide-dark')

    // ─ Ctrl+S → Save ───────────
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.()
    })

    // ─ Alt+Z → Word Wrap toggle ─
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, () => {
      const current = editor.getOption(monaco.editor.EditorOption.wordWrap)
      editor.updateOptions({ wordWrap: current === 'on' ? 'off' : 'on' })
    })
  }, [onSave])

  const handleChange = useCallback((value) => {
    if (currentFile) {
      handleEditorChange(value, currentFile)
    }
  }, [currentFile, handleEditorChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d18' }}>
      {currentFile ? (
        <Editor
          height="100%"
          language={language}
          value={editorContent}
          onChange={handleChange}
          onMount={handleMount}
          theme="us-ide-dark"
          options={{
            fontSize: 13,
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
            fontLigatures: true,
            minimap: { enabled: true, maxColumn: 80 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            renderWhitespace: 'none',
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
