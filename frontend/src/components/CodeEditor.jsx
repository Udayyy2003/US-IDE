import React, { useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { useIDE } from '../contexts/IDEContext'

const LANG_MAP = {
  python: 'python',
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  javascript: 'javascript',
  typescript: 'typescript',
  html: 'html',
  css: 'css',
  json: 'json',
}

// Monaco editor theme definition
const USID_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '555570', fontStyle: 'italic' },
    { token: 'keyword', foreground: '7c6df5', fontStyle: 'bold' },
    { token: 'string', foreground: '00ff94' },
    { token: 'number', foreground: 'ffd60a' },
    { token: 'type', foreground: '00d4ff' },
    { token: 'function', foreground: '9d8fff' },
    { token: 'variable', foreground: 'e8e8f0' },
    { token: 'constant', foreground: 'ff9500' },
    { token: 'operator', foreground: 'e8e8f0' },
  ],
  colors: {
    'editor.background': '#0d0d15',
    'editor.foreground': '#e8e8f0',
    'editor.lineHighlightBackground': '#1a1a24',
    'editor.selectionBackground': '#7c6df540',
    'editor.selectionHighlightBackground': '#7c6df520',
    'editorCursor.foreground': '#7c6df5',
    'editorLineNumber.foreground': '#2a2a3d',
    'editorLineNumber.activeForeground': '#555570',
    'editorGutter.background': '#0d0d15',
    'editorIndentGuide.background': '#1f1f2e',
    'editorIndentGuide.activeBackground': '#2a2a3d',
    'editor.findMatchBackground': '#7c6df540',
    'editor.findMatchHighlightBackground': '#7c6df520',
    'editorBracketMatch.background': '#7c6df530',
    'editorBracketMatch.border': '#7c6df5',
    'scrollbarSlider.background': '#2a2a3d80',
    'scrollbarSlider.hoverBackground': '#7c6df540',
    'minimap.background': '#0a0a0f',
  }
}

export default function CodeEditor({ onSave }) {
  const editorRef = useRef(null)
  const { editorContent, setEditorContent, currentLanguage, currentFile } = useIDE()

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    // Register custom theme
    monaco.editor.defineTheme('us-ide-dark', USID_THEME)
    monaco.editor.setTheme('us-ide-dark')

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.()
    })

    // Word wrap toggle
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, () => {
      const current = editor.getOption(monaco.editor.EditorOption.wordWrap)
      editor.updateOptions({ wordWrap: current === 'on' ? 'off' : 'on' })
    })
  }, [onSave])

  const language = LANG_MAP[currentLanguage] || 'plaintext'

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border-subtle overflow-x-auto" style={{ background: '#0a0a0f', minHeight: 35 }}>
        {currentFile ? (
          <div className={`tab-item active flex items-center gap-2 px-4 py-2 text-xs font-mono text-text-primary cursor-default`} style={{ borderRight: '1px solid #1f1f2e' }}>
            <span>{currentFile}</span>
          </div>
        ) : (
          <div className="px-4 py-2 text-xs text-text-muted font-mono">No file open</div>
        )}
      </div>

      {/* Editor */}
      {currentFile ? (
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={language}
            value={editorContent}
            onChange={value => setEditorContent(value || '')}
            onMount={handleEditorMount}
            theme="us-ide-dark"
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              lineHeight: 1.6,
              padding: { top: 16, bottom: 16 },
              minimap: { enabled: true, scale: 1, renderCharacters: false },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              wordWrap: 'off',
              tabSize: 4,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: false,
              suggestOnTriggerCharacters: true,
              quickSuggestions: { other: true, comments: false, strings: false },
              parameterHints: { enabled: true },
              acceptSuggestionOnCommitCharacter: true,
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
                useShadows: false,
              },
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              renderLineHighlight: 'line',
              contextmenu: true,
              links: true,
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ background: '#0d0d15' }}>
          <div className="text-5xl mb-4 opacity-50">📝</div>
          <p className="text-text-secondary font-semibold">No file open</p>
          <p className="text-text-muted text-sm mt-1">Select a file from the explorer or create a new project</p>
          <div className="mt-6 text-xs text-text-muted font-mono space-y-1">
            <div><span className="text-accent-primary">Ctrl+S</span> — Save file</div>
            <div><span className="text-accent-primary">Alt+Z</span> — Toggle word wrap</div>
          </div>
        </div>
      )}
    </div>
  )
}
