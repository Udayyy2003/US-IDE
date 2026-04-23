import React from 'react';

export default function DownloadSection({ downloadLink }) {
  return (
    <section style={{
      padding: '60px 20px',
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      marginBottom: '80px'
    }}>
      <h2 style={{
        fontSize: '32px',
        fontWeight: 800,
        marginBottom: '24px',
        color: '#fff',
        fontFamily: '"Plus Jakarta Sans", sans-serif'
      }}>
        Download US-IDE
      </h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '40px',
          width: '100%',
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ color: '#8888a0', fontSize: '13px', marginBottom: '8px' }}>OS</div>
            <div style={{ color: '#fff', fontWeight: 600 }}>Windows</div>
          </div>
          <div>
            <div style={{ color: '#8888a0', fontSize: '13px', marginBottom: '8px' }}>Version</div>
            <div style={{ color: '#fff', fontWeight: 600 }}>v1.0.1</div>
          </div>
          <div>
            <div style={{ color: '#8888a0', fontSize: '13px', marginBottom: '8px' }}>Size</div>
            <div style={{ color: '#fff', fontWeight: 600 }}>~92 MB</div>
          </div>
        </div>

        <button
          onClick={() => window.open(downloadLink, '_blank')}
          style={{
            background: 'linear-gradient(135deg, #7c6df5, #5b4ed8)',
            color: '#fff',
            border: 'none',
            padding: '16px 40px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span>⬇</span> Download .exe
        </button>

        <p style={{
          fontSize: '14px',
          color: '#555570',
          marginTop: '10px'
        }}>
          "Runs locally with full file system and terminal access"
        </p>
      </div>
    </section>
  );
}
