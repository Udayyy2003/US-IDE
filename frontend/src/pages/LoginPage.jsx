import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Language snippets for the animated background
const CODE_SNIPPETS = [
  { lang: 'Python', code: `def fibonacci(n):\n    if n <= 1: return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))` },
  { lang: 'C++', code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, US-IDE!" << endl;\n    return 0;\n}` },
  { lang: 'Java', code: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}` },
  { lang: 'C', code: `#include <stdio.h>\n\nint factorial(int n) {\n    return n <= 1 ? 1 : n * factorial(n-1);\n}` },
]

const FEATURES = [
  { icon: '⚡', title: 'AI-Powered', desc: 'Groq LLaMA 3 integration for instant code help' },
  { icon: '🐳', title: 'Sandboxed', desc: 'Docker containers for secure code execution' },
  { icon: '🌐', title: 'Multi-Language', desc: 'Python, C, C++, Java support out of the box' },
  { icon: '🔐', title: 'Secure', desc: 'Google OAuth authentication + JWT sessions' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, handleGoogleLogin } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeSnippet, setActiveSnippet] = useState(0)
  const googleBtnRef = useRef(null)

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/ide')
  }, [user, navigate])

  // Cycle through code snippets
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSnippet(prev => (prev + 1) % CODE_SNIPPETS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Initialize Google Identity Services
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    
    const initGoogle = () => {
      if (!clientId || !window.google) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
      })

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          width: 280,
        })
      }
    }

    // Try immediately
    initGoogle()

    // Also try after a short delay if it wasn't ready
    const timer = setTimeout(initGoogle, 1000)
    
    // Add event listener for script load just in case
    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (script) {
      script.addEventListener('load', initGoogle)
    }

    return () => {
      clearTimeout(timer)
      if (script) script.removeEventListener('load', initGoogle)
    }
  }, [])

  const handleGoogleCallback = async (response) => {
    setLoading(true)
    setError('')
    try {
      await handleGoogleLogin(response.credential)
      navigate('/ide')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const snippet = CODE_SNIPPETS[activeSnippet]

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col overflow-auto" style={{ fontFamily: 'Geist, sans-serif' }}>
      {/* Animated background grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(124, 109, 245, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124, 109, 245, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '20%', left: '15%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(124, 109, 245, 0.12) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '10%',
          width: 350, height: 350,
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)',
        }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c6df5, #00d4ff)' }}>
            <span className="text-white font-bold text-xs">US</span>
          </div>
          <span className="text-text-primary font-semibold text-lg tracking-tight">US-IDE</span>
          <span className="px-2 py-0.5 text-xs rounded-full font-mono" style={{ background: 'rgba(124, 109, 245, 0.15)', color: '#9d8fff' }}>v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-text-muted text-sm">Built for developers</span>
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-8 py-16">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Hero */}
          <div className="space-y-8 animate-slide-up">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-6" style={{ background: 'rgba(124, 109, 245, 0.1)', border: '1px solid rgba(124, 109, 245, 0.2)', color: '#9d8fff' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                AI-Powered Cloud IDE
              </div>
              <h1 className="text-6xl font-bold leading-tight" style={{ letterSpacing: '-0.03em' }}>
                <span style={{ background: 'linear-gradient(135deg, #e8e8f0 0%, #7c6df5 50%, #00d4ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Code Smarter,
                </span>
                <br />
                <span className="text-text-primary">Not Harder.</span>
              </h1>
              <p className="text-text-secondary text-lg mt-4 leading-relaxed" style={{ maxWidth: 440 }}>
                Browser-based IDE with AI assistance, secure Docker execution, and support for Python, C, C++, and Java.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="p-4 rounded-xl border border-border-subtle" style={{ background: 'rgba(26, 26, 36, 0.6)', backdropFilter: 'blur(8px)' }}>
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="text-text-primary font-semibold text-sm">{f.title}</div>
                  <div className="text-text-muted text-xs mt-1">{f.desc}</div>
                </div>
              ))}
            </div>

            {/* Login card */}
            <div className="p-6 rounded-2xl border border-border-default" style={{ background: 'rgba(17, 17, 24, 0.8)', backdropFilter: 'blur(16px)' }}>
              <h2 className="text-text-primary font-semibold mb-1">Get started for free</h2>
              <p className="text-text-muted text-sm mb-4">Sign in with your Google account to continue</p>
              
              {error && (
                <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(255, 77, 109, 0.1)', border: '1px solid rgba(255, 77, 109, 0.3)', color: '#ff4d6d' }}>
                  {error}
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 text-text-secondary text-sm mb-4">
                  <div className="spinner" />
                  Authenticating...
                </div>
              )}

              {/* Google Sign-In Button (rendered by GSI) */}
              <div ref={googleBtnRef} className="mb-3" />

              {/* Fallback if GSI not loaded */}
              {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <div className="p-3 rounded-lg text-xs font-mono" style={{ background: 'rgba(255, 149, 0, 0.1)', border: '1px solid rgba(255, 149, 0, 0.3)', color: '#ff9500' }}>
                  ⚠️ Set VITE_GOOGLE_CLIENT_ID in .env to enable Google login
                </div>
              )}

              <p className="text-text-muted text-xs mt-3">
                By signing in, you agree to our terms. Only verified Google accounts allowed.
              </p>
            </div>
          </div>

          {/* Right: Code preview */}
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-border-default overflow-hidden" style={{ background: '#111118', boxShadow: '0 0 80px rgba(124, 109, 245, 0.15)' }}>
              {/* Editor title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle" style={{ background: '#0a0a0f' }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ff4d6d' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ffd60a' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#00ff94' }} />
                </div>
                <span className="text-text-muted text-xs font-mono ml-2">us-ide — {snippet.lang}</span>
              </div>
              
              {/* Code content */}
              <div className="p-6 font-mono text-sm" style={{ minHeight: 280 }}>
                <pre style={{ color: '#e8e8f0', lineHeight: 1.7, transition: 'opacity 0.5s' }}>
                  {snippet.code.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="select-none w-8 text-right mr-4" style={{ color: '#555570' }}>{i + 1}</span>
                      <span style={{ color: syntaxColor(line) }}>{line}</span>
                    </div>
                  ))}
                </pre>
              </div>

              {/* Terminal preview */}
              <div className="border-t border-border-subtle p-4" style={{ background: '#0d0d15' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono" style={{ color: '#555570' }}>TERMINAL</span>
                  <div className="flex-1 h-px" style={{ background: '#1f1f2e' }} />
                </div>
                <div className="font-mono text-xs space-y-1">
                  <div style={{ color: '#555570' }}>$ python main.py</div>
                  <div className="terminal-output" style={{ color: '#00ff94' }}>Hello, World!</div>
                  <div style={{ color: '#555570' }}>Process exited with code 0</div>
                  <div className="flex items-center">
                    <span style={{ color: '#7c6df5' }}>$ </span>
                    <span className="ml-1 w-2 h-4 inline-block animate-pulse" style={{ background: '#7c6df5' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Badge */}
            <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-border-subtle" style={{ background: 'rgba(124, 109, 245, 0.05)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: 'rgba(124, 109, 245, 0.15)' }}>🤖</div>
              <div>
                <div className="text-text-primary text-sm font-semibold">Powered by LLaMA 3 70B</div>
                <div className="text-text-muted text-xs">via Groq API • Ultra-fast inference</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Very simple syntax color hint (not real parser, just visual)
function syntaxColor(line) {
  if (line.trim().startsWith('#include') || line.trim().startsWith('import') || line.trim().startsWith('from')) return '#7c6df5'
  if (line.includes('def ') || line.includes('int ') || line.includes('void ') || line.includes('class ')) return '#00d4ff'
  if (line.includes('"') || line.includes("'")) return '#00ff94'
  if (line.trim().startsWith('//') || line.trim().startsWith('#')) return '#555570'
  return '#e8e8f0'
}
