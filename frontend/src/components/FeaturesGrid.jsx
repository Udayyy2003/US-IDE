import React from 'react';

const FEATURES = [
  { icon: '🧠', title: 'AI Assistant', desc: 'Generate, fix, and explain code with built-in intelligence.' },
  { icon: '📁', title: 'File System Access', desc: 'Open, edit, rename, and delete files with local system support.' },
  { icon: '💻', title: 'VS Code-like Editor', desc: 'Familiar tabs, syntax highlighting, and Monaco Editor performance.' },
  { icon: '▶', title: 'Run Code', desc: 'Execute Python, C++, Java, and more with zero-config setup.' },
  { icon: '🖥', title: 'Built-in Terminal', desc: 'Native terminal support for real-time process interaction.' },
  { icon: '💾', title: 'Auto Save', desc: 'Never lose code with Ctrl + S and background auto-save sync.' },
];

export default function FeaturesGrid() {
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
        ✨ Features of US-IDE
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {FEATURES.map((feature, idx) => (
          <div key={idx} style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'left',
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
              fontSize: '32px',
              marginBottom: '20px',
              background: 'rgba(124, 109, 245, 0.1)',
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {feature.icon}
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '12px'
            }}>
              {feature.title}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#8888a0',
              lineHeight: '1.6'
            }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
