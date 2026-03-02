import React, { useState, useRef, useEffect } from 'react'
import { aiChat } from '../utils/api'
import { useIDE } from '../contexts/IDEContext'

// Simple markdown renderer
function MessageContent({ text }) {
  // Split on code blocks
  const parts = text.split(/(```[\s\S]*?```)/g)
  return (
    <div className="ai-response text-xs leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).split('\n')
          const lang = lines[0].trim()
          const code = lines.slice(1).join('\n')
          return (
            <pre key={i} style={{ background: '#0a0a0f', border: '1px solid #2a2a3d', borderRadius: 8, padding: '10px 12px', margin: '8px 0', overflowX: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
              {lang && <div style={{ color: '#555570', marginBottom: 6, fontSize: 10 }}>{lang}</div>}
              <code style={{ color: '#e8e8f0' }}>{code}</code>
            </pre>
          )
        }
        // Inline code
        const inlineParts = part.split(/(`[^`]+`)/g)
        return (
          <span key={i}>
            {inlineParts.map((ip, j) => {
              if (ip.startsWith('`') && ip.endsWith('`')) {
                return <code key={j} style={{ background: '#1a1a24', color: '#9d8fff', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' }}>{ip.slice(1, -1)}</code>
              }
              return <span key={j} style={{ whiteSpace: 'pre-wrap' }}>{ip}</span>
            })}
          </span>
        )
      })}
    </div>
  )
}

const QUICK_ACTIONS = [
  { id: 'explain', label: '💡 Explain Code', action: 'explain' },
  { id: 'fix', label: '🔧 Fix Errors', action: 'fix' },
  { id: 'optimize', label: '⚡ Optimize', action: 'optimize' },
  { id: 'generate', label: '✨ Generate', action: 'generate' },
]

export default function AIChatPanel() {
  const { editorContent, currentLanguage, currentFile } = useIDE()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your US-IDE AI Assistant powered by LLaMA 3.3. I can help you write, explain, fix, and optimize code. What would you like to do?",
      timestamp: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text, action = 'chat') => {
    if ((!text.trim() && action === 'chat') || loading) return

    const userMsg = { role: 'user', content: text || `[${action}]`, timestamp: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await aiChat({
        message: text,
        code: editorContent,
        language: currentLanguage,
        action,
        history: messages.slice(-10),
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        timestamp: Date.now()
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${err.response?.data?.error || 'Failed to get AI response. Check your Groq API key.'}`,
        timestamp: Date.now(),
        error: true
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared. How can I help you?",
      timestamp: Date.now()
    }])
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#111118' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle" style={{ minHeight: 36 }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center text-sm" style={{ background: 'rgba(124, 109, 245, 0.2)' }}>🤖</div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-mono">LLaMA 3.3</span>
          <button onClick={clearChat} className="text-xs text-text-muted hover:text-text-primary transition-colors">Clear</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-1 p-2 border-b border-border-subtle">
        {QUICK_ACTIONS.map(qa => (
          <button
            key={qa.id}
            onClick={() => sendMessage('', qa.action)}
            disabled={loading}
            className="p-1.5 rounded-lg text-xs text-left transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: 'rgba(124, 109, 245, 0.08)', border: '1px solid rgba(124, 109, 245, 0.15)', color: '#9d8fff' }}
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-full rounded-xl px-3 py-2 ${msg.role === 'user' ? 'ml-4' : 'mr-4'}`} style={{
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #7c6df5, #5b4ed8)'
                : msg.error ? 'rgba(255,77,109,0.1)' : '#1a1a24',
              border: msg.role === 'user' ? 'none' : `1px solid ${msg.error ? 'rgba(255,77,109,0.3)' : '#2a2a3d'}`,
              color: msg.role === 'user' ? '#fff' : '#e8e8f0',
            }}>
              {msg.role === 'user' ? (
                <p className="text-xs">{msg.content}</p>
              ) : (
                <MessageContent text={msg.content} />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#1a1a24', border: '1px solid #2a2a3d' }}>
              <div className="spinner" style={{ width: 12, height: 12 }} />
              <span className="text-text-muted text-xs">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border-subtle">
        {currentFile && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-text-muted font-mono">
            <span>📎</span>
            <span className="truncate">{currentFile}</span>
            <span style={{ color: '#7c6df5' }}>[{currentLanguage}]</span>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-sans outline-none resize-none"
            style={{ background: '#0a0a0f', border: '1px solid #2a2a3d', color: '#e8e8f0', caretColor: '#7c6df5', lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = '#7c6df5'}
            onBlur={e => e.target.style.borderColor = '#2a2a3d'}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="self-end px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
            style={{ background: '#7c6df5', color: '#fff', minWidth: 44 }}
          >
            {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
