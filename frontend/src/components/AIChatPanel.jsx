import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { aiChat } from '../utils/api'
import { useEditor } from '../contexts/EditorContext'
import { useFiles } from '../contexts/FileContext'
import { useAuth } from '../contexts/AuthContext'
import { useTabs } from '../contexts/TabContext'
import { useSettings } from '../contexts/SettingsContext'
import { getFileIcon, getIconColor } from '../utils/fileIcons'
import { FolderOpen, Settings } from 'lucide-react'

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
)
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
)
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
)
const LikeIcon = ({ active }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
)
const DislikeIcon = ({ active }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
)

const MicIcon = ({ active, pulse }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: pulse ? 'pulse 1.5s infinite' : 'none' }}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
)
const PaperclipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
)
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
)

const CheckCircleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
)
const ReplaceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3L21 7L17 11"></path><path d="M3 13L7 17L3 21"></path><path d="M21 7H10C7.79086 7 6 8.79086 6 11V13"></path><path d="M3 17H14C16.2091 17 18 15.2091 18 13V11"></path></svg>
)
const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
)

// ─── Message Content Renderer ──────────────────────────────────────────────
const MessageContent = ({ text, role, attachments, onAction, disableInsert, theme }) => {
  const [copiedText, setCopiedText] = useState(null)

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content)
    setCopiedText(content)
    setTimeout(() => setCopiedText(null), 2000)
  }

  // Parse for special metadata
  const createMatch = text.match(/\[CREATE_FILE:\s*([^\]]+)\]/)
  const modifyMatch = text.match(/\[MODIFY_FILE:\s*([^\]]+)\]/)
  const cleanText = text.replace(/\[(CREATE|MODIFY)_FILE:\s*[^\]]+\]/g, '').trim()

  return (
    <div className="markdown-content" style={{ fontSize: '14px', lineHeight: '1.6', color: role === 'user' ? '#fff' : '#d1d1e0' }}>
      {attachments && attachments.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {attachments.map((file, idx) => (
            <div key={idx} style={{ 
              background: '#1a1a2e', border: '1px solid #2a2a3d', borderRadius: '8px', 
              padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              {file.type.startsWith('image/') ? (
                <img src={file.preview} alt="attached" style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }} />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {(() => {
                    const Icon = getFileIcon(file.name, false);
                    return <Icon size={14} color={getIconColor(file.name, false)} />;
                  })()}
                </span>
              )}
              <span style={{ fontSize: '11px', color: '#8888a0', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            // Trim leading newlines from AI generated code
            const rawCode = String(children).replace(/\n$/, '')
            const code = rawCode.startsWith('\n') ? rawCode.substring(1) : rawCode;
            if (!inline && match) {
              const lang = match[1]
              return (
                <div style={{ margin: '16px 0', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0d0d18' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '11px', color: '#8888a0', fontFamily: 'monospace', textTransform: 'lowercase', fontWeight: 600 }}>{lang}</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {createMatch ? (
                        <button 
                          onClick={() => onAction?.('create', code, createMatch[1])}
                          style={{ 
                            background: 'rgba(var(--accent-color-rgb), 0.1)', border: '1px solid rgba(var(--accent-color-rgb), 0.3)', 
                            color: 'var(--accent-color)', cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', gap: '6px', 
                            padding: '4px 8px', borderRadius: '6px',
                            fontSize: '11px', fontWeight: 700 
                          }}
                        >
                          <PlusIcon /> Create {createMatch[1]}
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => onAction?.('insert', code)}
                            disabled={disableInsert}
                            title={disableInsert ? "Open a file to insert code" : "Append code to the current file"}
                            style={{ 
                              background: 'none', border: 'none', 
                              color: disableInsert ? '#444466' : 'var(--accent-color)', 
                              cursor: disableInsert ? 'not-allowed' : 'pointer', 
                              display: 'flex', alignItems: 'center', gap: '6px', 
                              fontSize: '11px', fontWeight: 700 
                            }}
                          >
                            <EditIcon /> Insert
                          </button>
                          <button 
                            onClick={() => onAction?.('replace', code)}
                            disabled={disableInsert}
                            title={disableInsert ? "Open a file to replace code" : "Replace all content in current file"}
                            style={{ 
                              background: 'none', border: 'none', 
                              color: disableInsert ? '#444466' : 'var(--accent-color)', 
                              cursor: disableInsert ? 'not-allowed' : 'pointer', 
                              display: 'flex', alignItems: 'center', gap: '6px', 
                              fontSize: '11px', fontWeight: 700 
                            }}
                          >
                            <ReplaceIcon /> Replace
                          </button>
                        </>
                      )}
                      <div style={{ width: 1, height: 14, background: '#2a2a3d', margin: '0 4px' }} />
                      <button 
                        onClick={() => handleCopy(code)}
                        style={{ background: 'none', border: 'none', color: '#8888a0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600 }}
                      >
                        {copiedText === code ? <CheckIcon /> : <CopyIcon />}
                      </button>
                    </div>
                  </div>
                  <SyntaxHighlighter
                    style={theme === 'light' ? vs : atomDark}
                    language={lang}
                    PreTag="div"
                    customStyle={{ margin: 0, padding: '16px', background: theme === 'light' ? '#f5f5f5' : '#0a0a0f', fontSize: '12.5px' }}
                    {...props}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              )
            }
            return (
              <code style={{ 
                background: 'rgba(var(--accent-color-rgb), 0.15)', 
                color: 'var(--accent-color)', 
                padding: '2px 6px', 
                borderRadius: '5px', 
                fontFamily: '"JetBrains Mono", monospace', 
                fontSize: '0.9em',
                fontWeight: 500
              }} {...props}>
                {children}
              </code>
            )
          },
          p: ({ children }) => <p style={{ marginBottom: '16px' }}>{children}</p>,
          ul: ({ children }) => <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: '20px', marginBottom: '16px' }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: '8px' }}>{children}</li>,
          h1: ({ children }) => <h1 style={{ fontSize: '1.5em', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: '1.3em', fontWeight: 700, marginBottom: '14px', color: '#fff' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: '1.1em', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: '3px solid #7c6df5', paddingLeft: '16px', margin: '16px 0', color: '#8888a0', fontStyle: 'italic' }}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', marginBottom: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>{children}</table>
            </div>
          ),
          th: ({ children }) => <th style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700 }}>{children}</th>,
          td: ({ children }) => <td style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{children}</td>,
        }}
      >
        {cleanText}
      </ReactMarkdown>
    </div>
  )
}

const QUICK_ACTIONS = [
  { id: 'explain', label: '💡 Explain', action: 'explain' },
  { id: 'fix', label: '🔧 Fix', action: 'fix' },
  { id: 'optimize', label: '⚡ Optimize', action: 'optimize' },
  { id: 'generate', label: '✨ Generate', action: 'generate' },
]

export default function AIChatPanel() {
  const { editorContent, currentLanguage, currentFile, replaceContent, insertAtCursor } = useEditor()
  const { workspaceRoot, fileTree, createFile, loadFiles } = useFiles()
  const { openFile } = useTabs()
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const [messages, setMessages] = useState([{
    id: 'welcome',
    role: 'assistant',
    content: "Welcome to **US Assistant** 🚀\n\nTo get started:\n1. Open a folder\n2. Create or select a file\n3. Start coding with AI",
    timestamp: Date.now(),
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [reactions, setReactions] = useState({}) // { msgId: 'like' | 'dislike' }
  const [copiedId, setCopiedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [isListening, setIsListening] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState({ show: false, code: '', type: '', filename: '' })
  const [javaFolderSuggestion, setJavaFolderSuggestion] = useState(null) // { code, filename }
  
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // ─── Initializing State ───
  
  // ─── Speech Recognition Setup ──────────────────────────────────────────
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = SpeechRecognition ? new SpeechRecognition() : null

  if (recognition) {
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev + (prev ? ' ' : '') + transcript)
      setIsListening(false)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error)
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)
  }

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this environment.')
      return
    }
    if (isListening) {
      recognition.stop()
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  // ─── File Handling ──────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const newAttachments = files.map(file => ({
      file,
      name: file.name,
      type: file.type,
      preview: URL.createObjectURL(file)
    }))
    setAttachments(prev => [...prev, ...newAttachments])
    e.target.value = null // Reset input
  }

  const removeAttachment = (index) => {
    setAttachments(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const sendMessage = async (text, action = 'chat', isEdit = false) => {
    if ((!text.trim() && attachments.length === 0 && action === 'chat') || loading) return

    // ─── Context Check ───
    if (!workspaceRoot) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "⚠️ **No project folder open.** Please open a folder to enable AI context and file operations.",
        timestamp: Date.now(),
        error: true,
        showOpenFolderBtn: true
      }])
      return
    }
    
    const userMsg = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text || `[${action}]`, 
      timestamp: Date.now(),
      attachments: [...attachments]
    }
    
    let newMsgs;
    if (isEdit && editingId) {
      const index = messages.findIndex(m => m.id === editingId)
      if (index === -1) return
      newMsgs = [...messages.slice(0, index), userMsg]
      setEditingId(null)
    } else {
      newMsgs = [...messages, userMsg]
    }
    
    setMessages(newMsgs)
    setInput('')
    setAttachments([]) // Clear after sending
    setLoading(true)

    try {
      const fileContext = attachments.length > 0 
        ? `\n\nAttachments: ${attachments.map(a => a.name).join(', ')}`
        : ''

      const res = await aiChat({
        message: text + fileContext,
        code: editorContent,
        language: currentLanguage,
        action,
        current_file: currentFile,
        file_tree: fileTree,
        workspace_root: workspaceRoot,
        history: newMsgs.slice(-8).map(m => ({ role: m.role, content: m.content })),
      })
      
      if (res.data.success) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: res.data.response, timestamp: Date.now() }])
      } else {
        throw new Error(res.data.error || 'Unknown AI error')
      }
    } catch (err) {
      const isNetworkError = err.code === 'ERR_NETWORK' || !err.response
      const msg = err.response?.data?.error
        || (isNetworkError
            ? `⚠️ AI service is currently unavailable. The backend may be sleeping or starting up. Please try again in a moment.`
            : 'Could not reach AI. Check if the backend is running and the Groq API key is set.')
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: msg,
        timestamp: Date.now(),
        error: true,
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleEdit = (msg) => {
    setInput(msg.content)
    setEditingId(msg.id)
    inputRef.current?.focus()
  }

  const clearChat = () => {
    setMessages([{ id: 'clear', role: 'assistant', content: 'Chat cleared! How can I help?', timestamp: Date.now() }])
  }

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleReaction = (id, type) => {
    setReactions(prev => ({ ...prev, [id]: prev[id] === type ? null : type }))
  }

  const handleActionRequest = (type, code, filename = '') => {
    // Check for Java folder structure requirement
    const isJava = filename?.toLowerCase().endsWith('.java') || code?.includes('public class') || currentLanguage === 'java';
    
    if (type === 'create' && isJava) {
      // Auto-structure Java files: java/ClassName/ClassName.java
      let baseName = filename.replace('.java', '');
      if (baseName.includes('/')) {
        baseName = baseName.split('/').pop();
      }
      
      // If filename is just "HelloWorld.java", transform to "java/HelloWorld/HelloWorld.java"
      let structuredFilename = filename;
      if (!filename.startsWith('java/')) {
        structuredFilename = `java/${baseName}/${baseName}.java`;
      } else if (filename.split('/').length === 2) {
        // Handle "java/HelloWorld.java" -> "java/HelloWorld/HelloWorld.java"
        structuredFilename = `java/${baseName}/${baseName}.java`;
      }
      
      setShowConfirmModal({ show: true, type, code, filename: structuredFilename });
      return;
    }

    setShowConfirmModal({ show: true, type, code, filename });
  }

  const handleJavaFolderDecision = (useFolder) => {
    const { code, filename } = javaFolderSuggestion;
    const finalFilename = useFolder ? `java/${filename}` : filename;
    setJavaFolderSuggestion(null);
    setShowConfirmModal({ show: true, type: 'create', code, filename: finalFilename });
  }

  const confirmAction = async () => {
    const { type, code, filename } = showConfirmModal;
    
    try {
      if (type === 'insert') {
        insertAtCursor(code);
      } else if (type === 'replace') {
        replaceContent(code);
      } else if (type === 'create' && filename) {
        // Construct the full path in the workspace root
        const fullPath = workspaceRoot.includes('\\') 
          ? `${workspaceRoot}\\${filename}` 
          : `${workspaceRoot}/${filename}`;
        
        console.log("[AI] Creating file at:", fullPath);
        
        // Pass the code directly to createFile so it's written instantly
        const res = await createFile(fullPath, code);
        if (res.success) {
          // Force a refresh of the file tree
          await loadFiles();
          
          // Open the newly created file in a new tab with the code already present
          openFile({
            name: filename,
            path: fullPath,
            content: code,
            language: filename.split('.').pop() || 'plaintext'
          });
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ Successfully created **${filename}** with the generated code.`,
            timestamp: Date.now()
          }]);
        } else {
          throw new Error(res.error || "Failed to create file");
        }
      }
    } catch (err) {
      console.error("[AI Action Error]", err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ **Error:** ${err.message}`,
        timestamp: Date.now(),
        error: true
      }]);
    }
    
    setShowConfirmModal({ show: false, code: '', type: '', filename: '' });
  }

  const handleOpenFolderRequest = async () => {
    if (window.api) {
      const folder = await window.api.openFolder();
      if (folder) {
        const name = folder.split(/[\\/]/).pop();
        openProject({ name, path: folder });
        // Send a followup message to AI to let it know folder is open
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Opened folder: **${name}**. You can now ask me to create or modify files!`,
          timestamp: Date.now()
        }]);
      }
    } else {
      alert("Open Folder is only available in the desktop app.");
    }
  }

  if (initializing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0a0a0f', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(124,109,245,0.1)', borderTopColor: '#7c6df5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#8888a0', fontSize: '13px', fontWeight: 500 }}>Initializing AI workspace...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0f', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#0a0a0f', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 700, 
            color: '#fff', 
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Outfit', sans-serif"
          }}>
            US
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
              US-IDE <span style={{ color: 'var(--accent-color)' }}>Intelligence</span>
            </div>
            <div style={{ fontSize: '10px', color: '#555570', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
              PROPRIETARY CORE · V1.0
            </div>
          </div>
        </div>
        
        <button 
          onClick={clearChat} 
          style={{ 
            fontSize: '11px', color: '#8888a0', background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', 
            padding: '6px 14px', borderRadius: '8px', fontWeight: 700, 
            transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8888a0'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        >New Chat</button>
      </div>

      {/* Messages */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {messages.map((msg, i) => (
          <div key={msg.id} style={{ display: 'flex', gap: '14px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '10px', 
                background: msg.role === 'user' ? 'rgba(var(--accent-color-rgb), 0.15)' : 'rgba(var(--accent-color-rgb), 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                border: msg.role === 'user' ? '1px solid rgba(var(--accent-color-rgb), 0.3)' : '1px solid rgba(var(--accent-color-rgb), 0.2)',
                overflow: 'hidden'
              }}>
                {msg.role === 'user' 
                  ? (user?.picture ? <img src={user.picture} style={{ width: '100%', height: '100%' }} /> : <span style={{ color: 'var(--accent-color)' }}>👤</span>) 
                  : <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 800, 
                      color: '#fff', 
                      background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontFamily: "'Outfit', sans-serif"
                    }}>US</div>}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: msg.role === 'user' ? '#fff' : 'var(--accent-color)' }}>
                {msg.role === 'user' ? 'You' : 'US-IDE AI'}
              </span>
            </div>
            
            <div style={{ paddingLeft: '44px' }}>
              <MessageContent 
                text={msg.content} 
                role={msg.role} 
                attachments={msg.attachments} 
                disableInsert={!currentFile}
                onAction={handleActionRequest}
                theme={settings.theme}
              />

              {msg.showOpenFolderBtn && (
                <button
                  onClick={handleOpenFolderRequest}
                  style={{
                    marginTop: '12px',
                    background: '#7c6df5',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FolderOpen size={14} /> Open Folder
                </button>
              )}

              {/* Message Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                {msg.role === 'user' && (
                  <button 
                    onClick={() => handleEdit(msg)}
                    style={{ background: 'none', border: 'none', color: '#555570', cursor: 'pointer', padding: '4px', borderRadius: '6px', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#8888a0'}
                    onMouseLeave={e => e.currentTarget.style.color = '#555570'}
                    title="Edit message"
                  >
                    <EditIcon />
                  </button>
                )}
                {msg.role === 'assistant' && !msg.error && msg.id !== 'welcome' && (
                  <>
                    <button 
                      onClick={() => handleCopy(msg.id, msg.content)}
                      style={{ background: 'none', border: 'none', color: copiedId === msg.id ? '#00e888' : '#444466', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', transition: 'color 0.2s' }}
                      onMouseEnter={e => !copiedId && (e.currentTarget.style.color = '#8888a0')}
                      onMouseLeave={e => !copiedId && (e.currentTarget.style.color = '#444466')}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    <button 
                      onClick={() => handleReaction(msg.id, 'like')}
                      style={{ background: 'none', border: 'none', color: reactions[msg.id] === 'like' ? '#7c6df5' : '#444466', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#7c6df5'}
                      onMouseLeave={e => reactions[msg.id] !== 'like' && (e.currentTarget.style.color = '#444466')}
                    >
                      <LikeIcon active={reactions[msg.id] === 'like'} />
                    </button>
                    <button 
                      onClick={() => handleReaction(msg.id, 'dislike')}
                      style={{ background: 'none', border: 'none', color: reactions[msg.id] === 'dislike' ? '#ff4d6d' : '#444466', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ff4d6d'}
                      onMouseLeave={e => reactions[msg.id] !== 'dislike' && (e.currentTarget.style.color = '#444466')}
                    >
                      <DislikeIcon active={reactions[msg.id] === 'dislike'} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '14px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '28px', height: '28px', borderRadius: '8px', 
                background: 'rgba(var(--accent-color-rgb), 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(var(--accent-color-rgb), 0.2)'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  color: '#fff', 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: "'Outfit', sans-serif"
                }}>US</div>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-color)' }}>US-IDE AI</span>
            </div>
            <div style={{ paddingLeft: '44px', display: 'flex', alignItems: 'center', gap: '10px', color: '#555570', fontSize: '13px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '4px', height: '4px', background: '#7c6df5', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }} />
                <div style={{ width: '4px', height: '4px', background: '#7c6df5', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }} />
                <div style={{ width: '4px', height: '4px', background: '#7c6df5', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }} />
              </div>
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Footer Area */}
      <div style={{ padding: '20px', background: '#0a0a0f', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }} className="no-scrollbar">
          {QUICK_ACTIONS.map(qa => (
            <button
              key={qa.id}
              onClick={() => sendMessage('', qa.action)}
              style={{
                whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#aaaacc', padding: '8px 16px', borderRadius: '10px', fontSize: '11px',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c6df5'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#aaaacc' }}
            >{qa.label}</button>
          ))}
        </div>

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {attachments.map((file, idx) => (
              <div key={idx} style={{ 
                position: 'relative', background: '#1a1a2e', border: '1px solid #2a2a3d', 
                borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                {file.type.startsWith('image/') ? (
                  <img src={file.preview} alt="preview" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '16px' }}>📄</span>
                )}
                <span style={{ fontSize: '11px', color: '#e8e8f0', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
                <button 
                  onClick={() => removeAttachment(idx)}
                  style={{ background: '#2a2a3d', border: 'none', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ 
          position: 'relative', 
          background: '#16162a', 
          border: '1px solid #2a2a3d', 
          borderRadius: '14px',
          padding: '4px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
            {/* Attachment Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'none', border: 'none', color: '#555570', cursor: 'pointer', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Attach files or images"
            >
              <PaperclipIcon />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              multiple 
            />

            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { 
                  e.preventDefault(); 
                  sendMessage(input, 'chat', !!editingId) 
                }
              }}
              placeholder={editingId ? "Edit your message..." : "Message US-IDE AI..."}
              rows={1}
              style={{
                flex: 1, padding: '12px 0', fontSize: '14px',
                background: 'transparent', border: 'none', color: '#fff',
                resize: 'none', outline: 'none', fontFamily: 'inherit',
                maxHeight: '200px', overflowY: 'auto', lineHeight: '1.5'
              }}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', padding: '6px' }}>
              {/* Voice Mic Button */}
              <button 
                onClick={toggleListening}
                style={{ 
                  background: isListening ? 'rgba(255,77,109,0.15)' : 'none', 
                  border: 'none', color: isListening ? '#ff4d6d' : '#555570', 
                  cursor: 'pointer', padding: '8px', borderRadius: '8px',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title={isListening ? "Stop listening" : "Send voice query"}
              >
                <MicIcon active={isListening} pulse={isListening} />
              </button>

              {/* Send Button */}
              <button 
                onClick={() => sendMessage(input, 'chat', !!editingId)}
                disabled={(!input.trim() && attachments.length === 0) || loading}
                style={{ 
                  background: (!input.trim() && attachments.length === 0) || loading ? 'rgba(124,109,245,0.1)' : '#7c6df5', 
                  border: 'none', color: '#fff', cursor: 'pointer', 
                  width: '32px', height: '32px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  transition: 'all 0.2s', marginLeft: '4px',
                  opacity: (!input.trim() && attachments.length === 0) || loading ? 0.5 : 1
                }}
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
        
        <div style={{ 
          fontSize: '10px', 
          color: '#444466', 
          textAlign: 'center', 
          marginTop: '12px', 
          fontWeight: 600,
          letterSpacing: '0.02em'
        }}>
          US-IDE AI can make mistakes. Check important info.
        </div>
      </div>

      {/* Professional VS Code-style Command Palette / Confirmation Popup */}
      {showConfirmModal.show && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2000,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none'
        }}>
          <div style={{
            marginTop: '20px',
            width: '450px',
            background: '#1e1e2e',
            border: '1px solid #3c3c52',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            padding: '16px',
            pointerEvents: 'all',
            animation: 'slideDown 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '6px', 
                background: 'rgba(124,109,245,0.1)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c6df5" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
              </div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                  {showConfirmModal.type === 'create' ? `Create ${showConfirmModal.filename}?` : `Apply changes?`}
                </h3>
                <p style={{ color: '#8888a0', fontSize: '12px', margin: '2px 0 0 0' }}>
                  {showConfirmModal.type === 'create' 
                    ? `Create new file and apply AI-generated code.` 
                    : `Modify the current file with the suggested code.`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowConfirmModal({ show: false, code: '', type: '', filename: '' })}
                style={{ 
                  background: 'transparent', color: '#aaaacc', border: '1px solid #3c3c52', 
                  padding: '6px 16px', borderRadius: '4px', fontSize: '12px', 
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#555570'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#3c3c52'}
              >Cancel</button>
              <button 
                onClick={confirmAction}
                style={{ 
                  background: '#7c6df5', color: '#fff', border: 'none', 
                  padding: '6px 20px', borderRadius: '4px', fontSize: '12px', 
                  fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,109,245,0.3)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#8c7df6'}
                onMouseLeave={e => e.currentTarget.style.background = '#7c6df5'}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Java Folder Suggestion Popup */}
      {javaFolderSuggestion && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2000,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none'
        }}>
          <div style={{
            marginTop: '20px',
            width: '450px',
            background: '#1e1e2e',
            border: '1px solid #3c3c52',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            padding: '16px',
            pointerEvents: 'all',
            animation: 'slideDown 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: 6, 
                background: 'rgba(124,109,245,0.1)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                <span style={{ fontSize: 18 }}>📁</span>
              </div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                  Organize Java Files?
                </h3>
                <p style={{ color: '#8888a0', fontSize: '12px', margin: '2px 0 0 0' }}>
                  I recommend creating a <b>java/</b> folder to keep your project clean and avoid .class file clutter.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => handleJavaFolderDecision(false)}
                style={{ 
                  background: 'transparent', color: '#aaaacc', border: '1px solid #3c3c52', 
                  padding: '6px 16px', borderRadius: '4px', fontSize: '11px', 
                  fontWeight: 600, cursor: 'pointer'
                }}
              >Continue in Root (Not Recommended)</button>
              <button 
                onClick={() => handleJavaFolderDecision(true)}
                style={{ 
                  background: '#7c6df5', color: '#fff', border: 'none', 
                  padding: '6px 20px', borderRadius: '4px', fontSize: '11px', 
                  fontWeight: 600, cursor: 'pointer'
                }}
              >Create Folder (Recommended)</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  )
}
