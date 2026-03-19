import React from 'react';

const STEPS = [
  { icon: '1', title: 'Download the .exe file', desc: 'Click on the download button to get the Windows installer.' },
  { icon: '2', title: 'Run the installer', desc: 'Open the US-IDE-Setup.exe and follow the installation wizard.' },
  { icon: '3', title: 'Launch US-IDE', desc: 'Find US-IDE on your desktop or start menu and launch it.' },
  { icon: '4', title: 'Start coding 🚀', desc: 'Choose a folder and begin your AI-powered coding journey.' },
];

export default function InstallGuide() {
  return (
    <section style={{
      padding: '80px 20px',
      width: '100%',
      maxWidth: '1100px',
      margin: '0 auto'
    }}>
      <h2 style={{
        fontSize: '32px',
        fontWeight: 800,
        marginBottom: '40px',
        textAlign: 'center',
        color: '#fff',
        fontFamily: '"Plus Jakarta Sans", sans-serif'
      }}>
        How to Install
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px'
      }}>
        {STEPS.map((step, idx) => (
          <div key={idx} style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            transition: 'border-color 0.2s, transform 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(124, 109, 245, 0.3)';
            e.currentTarget.style.transform = 'translateY(-5px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #7c6df5, #5b4ed8)',
              color: '#fff',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 4px 12px rgba(124, 109, 245, 0.2)'
            }}>
              {step.icon}
            </div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '12px'
            }}>
              {step.title}
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#8888a0',
              lineHeight: '1.5'
            }}>
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
