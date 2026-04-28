import React from 'react';

export default function HeroSection({ downloadLink }) {
  return (
    <section style={{
      padding: '80px 20px',
      textAlign: 'center',
      background: 'radial-gradient(circle at center, rgba(124, 109, 245, 0.1) 0%, transparent 70%)',
      width: '100%',
      maxWidth: '1000px',
      margin: '0 auto'
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
        fontSize: '48px',
        fontWeight: 800,
        marginBottom: '16px',
        background: 'linear-gradient(to right, #fff, #8888a0)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: '"Plus Jakarta Sans", sans-serif'
      }}>
        US-IDE — AI Powered Desktop IDE
      </h1>

      <p style={{
        fontSize: '20px',
        color: '#8888a0',
        lineHeight: '1.6',
        marginBottom: '40px',
        maxWidth: '700px',
        margin: '0 auto 40px'
      }}>
        Code smarter with built-in AI, terminal execution, and full file system access.
      </p>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => window.open(downloadLink, '_blank')}
          style={{
            background: 'linear-gradient(135deg, #7c6df5, #5b4ed8)',
            color: '#fff',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 10px 20px rgba(124,109,245,0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 15px 30px rgba(124,109,245,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 20px rgba(124,109,245,0.2)';
          }}
        >
          <span>⬇</span> Download for Windows (v1.2.0)
        </button>

        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '16px 32px',
            borderRadius: '14px',
            fontWeight: 600,
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          Explore Demo
        </button>
      </div>
    </section>
  );
}
