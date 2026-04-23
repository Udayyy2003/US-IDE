import React from 'react';

const RELEASES = [
  {
    version: '1.0.1',
    status: 'latest',
    date: '2026-04-23',
    endOfSupport: '2028-10',
    schedule: 'v1.0.1 Notes',
    downloadUrl: 'https://github.com/Udayyy2003/US-IDE/releases/download/v1.0.1/US-IDE-Setup.exe'
  },
  {
    version: '1.0.0',
    status: 'stable',
    date: '2026-04-15',
    endOfSupport: '2028-04',
    schedule: 'v1.0.0 Notes',
    downloadUrl: 'https://github.com/Udayyy2003/US-IDE/releases/download/v1.0.0/US-IDE-Setup.exe'
  },
  {
    version: '0.9.5',
    status: 'security',
    date: '2026-03-10',
    endOfSupport: '2027-12',
    schedule: 'v0.9.5 Notes',
    downloadUrl: '#'
  },
  {
    version: '0.9.0',
    status: 'bugfix',
    date: '2026-02-01',
    endOfSupport: '2027-06',
    schedule: 'v0.9.0 Notes',
    downloadUrl: '#'
  },
  {
    version: '0.8.0',
    status: 'end-of-life',
    date: '2025-12-15',
    endOfSupport: '2026-04',
    schedule: 'v0.8.0 Notes',
    downloadUrl: '#'
  }
];

export default function ReleaseNotes() {
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
        🚀 Version History
      </h2>

      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '14px',
          color: '#e8e8f0'
        }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#8888a0' }}>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>IDE version</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Maintenance status</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Download</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>First released</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>End of support</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Release schedule</th>
            </tr>
          </thead>
          <tbody>
            {RELEASES.map((release, idx) => (
              <tr key={idx} style={{ 
                borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 109, 245, 0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'}
              >
                <td style={{ padding: '16px 24px', fontWeight: 800, color: '#fff' }}>
                  {release.version}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    color: release.status === 'latest' ? '#00ff94' : 
                           release.status === 'stable' ? '#7c6df5' :
                           release.status === 'security' ? '#ffd60a' :
                           release.status === 'bugfix' ? '#3b82f6' : '#555570',
                    fontSize: '13px'
                  }}>
                    {release.status}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {release.downloadUrl !== '#' ? (
                    <a href={release.downloadUrl} style={{ 
                      color: 'var(--accent-color)', 
                      textDecoration: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontWeight: 500 
                    }}>
                      <span style={{ fontSize: '16px' }}>⬇</span> Download
                    </a>
                  ) : (
                    <span style={{ color: '#33334d' }}>Unavailable</span>
                  )}
                </td>
                <td style={{ padding: '16px 24px', color: '#8888a0', fontFamily: 'monospace' }}>
                  {release.date}
                </td>
                <td style={{ padding: '16px 24px', color: '#8888a0', fontFamily: 'monospace' }}>
                  {release.endOfSupport}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <a href="#" style={{ color: '#555570', textDecoration: 'none', fontSize: '13px' }}>
                    {release.schedule}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
