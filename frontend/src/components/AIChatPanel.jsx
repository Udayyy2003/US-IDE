import React, { useState, useRef, useEffect } from 'react'
import { aiChat } from '../utils/api'
import { useIDE } from '../contexts/IDEContext'

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

// ─── Message Content Renderer ──────────────────────────────────────────────
function MessageContent({ text, role, attachments }) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  const [copied, setCopied] = useState(false)

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ fontSize: '13px', lineHeight: '1.6', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
                <span style={{ fontSize: '14px' }}>📄</span>
              )}
              <span style={{ fontSize: '11px', color: '#8888a0', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
            </div>
          ))}
        </div>
      )}
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).split('\n')
          const lang = lines[0].trim() || 'code'
          const code = lines.slice(1).join('\n')
          return (
            <div key={i} style={{ margin: '12px 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2a2a3d', background: '#0d0d18' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#1a1a2e', borderBottom: '1px solid #2a2a3d' }}>
                <span style={{ fontSize: '11px', color: '#8888a0', fontFamily: 'monospace', textTransform: 'lowercase' }}>{lang}</span>
                <button 
                  onClick={() => handleCopy(code)}
                  style={{ background: 'none', border: 'none', color: '#8888a0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre style={{
                padding: '12px', margin: 0, overflowX: 'auto', 
                fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', 
                whiteSpace: 'pre', background: '#0a0a0f'
              }}>
                <code style={{ color: '#e0e0f0' }}>{code}</code>
              </pre>
            </div>
          )
        }
        
        // Inline formatting (bold and inline code)
        const inlineParts = part.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
        return (
          <span key={i}>
            {inlineParts.map((ip, j) => {
              if (ip.startsWith('**') && ip.endsWith('**')) {
                return <strong key={j} style={{ color: '#fff', fontWeight: 600 }}>{ip.slice(2, -2)}</strong>
              }
              if (ip.startsWith('`') && ip.endsWith('`')) {
                return <code key={j} style={{ background: '#1e1e2e', color: '#ae9fff', padding: '2px 5px', borderRadius: '4px', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}>{ip.slice(1, -1)}</code>
              }
              return <span key={j} style={{ color: role === 'user' ? '#fff' : '#d1d1e0' }}>{ip}</span>
            })}
          </span>
        )
      })}
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
  const { editorContent, currentLanguage, currentFile } = useIDE()
  const [messages, setMessages] = useState([{
    id: 'welcome',
    role: 'assistant',
    content: "Hi! I'm your **US-IDE Personal Assistant**. I've been custom-built to help you navigate your project and write code efficiently.\n\nI can help you:\n- Explain and write code\n- Fix bugs and errors\n- Optimize performance\n- Generate new code",
    timestamp: Date.now(),
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [reactions, setReactions] = useState({}) // { msgId: 'like' | 'dislike' }
  const [copiedId, setCopiedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [isListening, setIsListening] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

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

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text, action = 'chat', isEdit = false) => {
    if ((!text.trim() && action === 'chat') || loading) return
    
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
      // In a real app, you'd upload files here. 
      // For now, we pass file names as context to the AI.
      const fileContext = attachments.length > 0 
        ? `\n\nAttachments: ${attachments.map(a => a.name).join(', ')}`
        : ''

      const res = await aiChat({
        message: text + fileContext,
        code: editorContent,
        language: currentLanguage,
        action,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0f', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #1f1f2e', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 34, height: 34, borderRadius: '10px', 
            background: 'linear-gradient(135deg, #7c6df5, #5b4ed8)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 4px 12px rgba(124,109,245,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '0.01em', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              US-IDE <span style={{ color: '#7c6df5' }}>Intelligence</span>
            </div>
            <div style={{ fontSize: '10px', color: '#555570', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PROPRIETARY CORE · v1.0
            </div>
          </div>
        </div>
        <button onClick={clearChat} style={{ fontSize: '11px', color: '#8888a0', background: 'rgba(255,255,255,0.03)', border: '1px solid #1f1f2e', cursor: 'pointer', padding: '5px 12px', borderRadius: '8px', fontWeight: 600, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = '#3a3a4d' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8888a0'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = '#1f1f2e' }}
        >New Chat</button>
      </div>

      {/* Messages */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {messages.map((msg, i) => (
          <div key={msg.id} style={{ display: 'flex', gap: '14px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '28px', height: '28px', borderRadius: '8px', 
                background: msg.role === 'user' ? '#2a2a3d' : 'linear-gradient(135deg, #7c6df5, #5b4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                boxShadow: msg.role === 'assistant' ? '0 2px 6px rgba(124,109,245,0.2)' : 'none'
              }}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: msg.role === 'user' ? '#e0e0f0' : '#7c6df5' }}>
                {msg.role === 'user' ? 'You' : 'US-IDE AI'}
              </span>
            </div>
            
            <div style={{ paddingLeft: '42px' }}>
              {msg.role === 'user'
                ? <p style={{ margin: 0, fontSize: '14px', color: '#fff', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                : <MessageContent text={msg.content} role={msg.role} attachments={msg.attachments} />
              }

              {/* Message Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
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
                {msg.role === 'assistant' && !msg.error && (
                  <>
                    <button 
                      onClick={() => handleCopy(msg.id, msg.content)}
                      style={{ background: 'none', border: 'none', color: copiedId === msg.id ? '#00e888' : '#555570', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', transition: 'color 0.2s' }}
                      onMouseEnter={e => !copiedId && (e.currentTarget.style.color = '#8888a0')}
                      onMouseLeave={e => !copiedId && (e.currentTarget.style.color = '#555570')}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    <button 
                      onClick={() => handleReaction(msg.id, 'like')}
                      style={{ background: 'none', border: 'none', color: reactions[msg.id] === 'like' ? '#7c6df5' : '#555570', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#7c6df5'}
                      onMouseLeave={e => reactions[msg.id] !== 'like' && (e.currentTarget.style.color = '#555570')}
                    >
                      <LikeIcon active={reactions[msg.id] === 'like'} />
                    </button>
                    <button 
                      onClick={() => handleReaction(msg.id, 'dislike')}
                      style={{ background: 'none', border: 'none', color: reactions[msg.id] === 'dislike' ? '#ff4d6d' : '#555570', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ff4d6d'}
                      onMouseLeave={e => reactions[msg.id] !== 'dislike' && (e.currentTarget.style.color = '#555570')}
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
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '6px', 
                background: 'linear-gradient(135deg, #7c6df5, #5b4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
              }}>AI</div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#8888a0' }}>Thinking...</span>
            </div>
            <div style={{ paddingLeft: '36px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c6df5', animation: `bounce 1s ${d}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Footer Area */}
      <div style={{ padding: '16px', borderTop: '1px solid #1f1f2e', background: '#0d0d18' }}>
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

        <div style={{ position: 'relative', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative', flex: 1 }}>
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
                width: '100%', padding: '14px 85px 14px 40px', borderRadius: '12px', fontSize: '13px',
                background: '#16162a', border: '1px solid #2a2a3d', color: '#fff',
                resize: 'none', outline: 'none', fontFamily: 'inherit',
                maxHeight: '200px', overflowY: 'auto', lineHeight: '1.5'
              }}
            />
            
            {/* Attachment Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ position: 'absolute', left: '12px', bottom: '12px', background: 'none', border: 'none', color: '#555570', cursor: 'pointer', padding: '4px' }}
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

            {/* Voice Mic Button */}
            <button 
              onClick={toggleListening}
              style={{ 
                position: 'absolute', right: '48px', bottom: '12px', 
                background: isListening ? 'rgba(255,77,109,0.15)' : 'none', 
                border: 'none', color: isListening ? '#ff4d6d' : '#555570', 
                cursor: 'pointer', padding: '4px', borderRadius: '6px',
                transition: 'all 0.2s'
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
                position: 'absolute', right: '8px', bottom: '8px',
                width: '32px', height: '32px', borderRadius: '8px',
                background: ((!input.trim() && attachments.length === 0) || loading) ? '#1f1f2e' : '#7c6df5',
                border: 'none', color: '#fff', cursor: ((!input.trim() && attachments.length === 0) || loading) ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
        
        {editingId && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
            <button 
              onClick={() => { setEditingId(null); setInput('') }}
              style={{ fontSize: '11px', color: '#8888a0', background: 'none', border: 'none', cursor: 'pointer' }}
            >Cancel</button>
          </div>
        )}

        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '10px', color: '#33334d' }}>
          US-IDE AI can make mistakes. Check important info.
        </div>
      </div>
    </div>
  )
}

