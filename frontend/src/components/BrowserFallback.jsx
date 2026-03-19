import React from 'react';
import HeroSection from './HeroSection';
import DownloadSection from './DownloadSection';
import FeaturesGrid from './FeaturesGrid';
import InstallGuide from './InstallGuide';

export default function BrowserFallback() {
  const downloadLink = 'https://github.com/Udayyy2003/US-IDE/releases/download/v1.0.0/US-IDE-Setup.exe';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: '#0a0a0f',
      color: '#e8e8f0',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflowX: 'hidden',
      paddingBottom: '60px'
    }}>
      {/* Browser Warning Box */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '20px auto 0',
        padding: '0 20px'
      }}>
        <div style={{
          background: 'rgba(255, 77, 109, 0.05)',
          border: '1px solid rgba(255, 77, 109, 0.2)',
          borderRadius: '12px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          backdropFilter: 'blur(5px)'
        }}>
          <span style={{ fontSize: '18px' }}>⚠</span>
          <span style={{ fontSize: '14px', color: '#ff4d6d', fontWeight: 600 }}>
            File system and code execution are only available in the desktop app
          </span>
        </div>
      </div>

      <HeroSection downloadLink={downloadLink} />
      
      <DownloadSection downloadLink={downloadLink} />
      
      <FeaturesGrid />
      
      <InstallGuide />

      {/* Footer */}
      <footer style={{
        padding: '60px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        width: '100%',
        textAlign: 'center',
        marginTop: '80px'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#555570',
          fontWeight: 500
        }}>
          Built with ❤️ using Electron + React + Flask + AI
        </p>
        <p style={{
          fontSize: '12px',
          color: '#33334d',
          marginTop: '12px'
        }}>
          © 2026 US-IDE Intelligence. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
