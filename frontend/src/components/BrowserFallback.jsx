import React from 'react'

export default function BrowserFallback() {
  const downloadUrl = 'https://github.com/Udayyy2003/US-IDE/releases/latest' // Placeholder link

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: '#0a0a0f',
      color: '#e8e8f0',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '20px',
      textAlign: 'center',
      overflowY: 'auto'
    }}>
      {/* Hero Section */}
      <div style={{
        maxWidth: '800px',
        width: '100%',
        padding: '40px 20px',
        borderRadius: '24px',
        background: 'linear-gradient(145deg, #11111d, #0d0d18)',
        border: '1px solid rgba(124,109,245,0.1)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        marginBottom: '40px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #7c6df5, #00d4ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 0 30px rgba(124,109,245,0.4)'
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 32, fontFamily: 'monospace' }}>US</span>
        </div>

        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: 800, 
          marginBottom: '16px',
          background: 'linear-gradient(to right, #fff, #8888a0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: '"Plus Jakarta Sans", sans-serif'
        }}>
          US-IDE <span style={{ color: '#7c6df5' }}>Intelligence</span>
        </h1>

        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'rgba(255,77,109,0.1)', 
          padding: '8px 16px', 
          borderRadius: '100px',
          border: '1px solid rgba(255,77,109,0.2)',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '14px' }}>🚫</span>
          <span style={{ fontSize: '13px', color: '#ff4d6d', fontWeight: 600 }}>File system access is not available in browser</span>
        </div>

        <p style={{ fontSize: '16px', color: '#8888a0', lineHeight: '1.6', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
          This is a web preview version of US-IDE. Due to browser security restrictions, 
          direct filesystem access and code execution are only available in the desktop version.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a 
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'linear-gradient(135deg, #7c6df5, #5b4ed8)',
              color: '#fff',
              textDecoration: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 20px rgba(124,109,245,0.2)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>⬇</span> Download US-IDE (.exe)
          </a>
          
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '14px 28px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            Explore Demo
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ maxWidth: '900px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', paddingBottom: '40px' }}>
        <FeatureCard 
          icon="✨" 
          title="Multi-language support" 
          desc="Run Python, C, C++, and Java with full interactive terminal support." 
        />
        <FeatureCard 
          icon="🤖" 
          title="AI Assistant" 
          desc="Proprietary AI core integrated directly into your workflow for code generation and bug fixes." 
        />
        <FeatureCard 
          icon="💻" 
          title="VS Code-like UI" 
          desc="Familiar layout with high-performance Monaco Editor and modern aesthetics." 
        />
        <FeatureCard 
          icon="⚡" 
          title="Terminal execution" 
          desc="Native speed process execution with zero-latency interactive stdin/stdout." 
        />
        <FeatureCard 
          icon="🔄" 
          title="Auto file sync" 
          desc="Real-time file system watching and automatic background saving." 
        />
        <FeatureCard 
          icon="🎤" 
          title="Voice Commands" 
          desc="Speak to your IDE to generate code or ask questions hands-free." 
        />
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '24px',
      textAlign: 'left',
      transition: 'border-color 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,109,245,0.3)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
    >
      <div style={{ fontSize: '24px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '13px', color: '#666680', lineHeight: '1.5' }}>{desc}</p>
    </div>
  )
}
