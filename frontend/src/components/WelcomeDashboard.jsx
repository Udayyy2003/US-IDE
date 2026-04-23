import React, { useState, useEffect } from 'react';
import { 
  FilePlus, 
  FolderOpen, 
  FileCode, 
  Mic, 
  Clock, 
  Zap, 
  Bot, 
  MessageSquare, 
  ChevronRight,
  Sparkles,
  Settings,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { useIDE } from '../contexts/IDEContext';
import { useFiles } from '../contexts/FileContext';
import { useTabs } from '../contexts/TabContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const WelcomeDashboard = ({ setShowLoginModal }) => {
  const { openNewFileModal, setVoiceSearchOpen, setAiPanelVisible } = useIDE();
  const { openProject } = useFiles();
  const { openTab } = useTabs();
  const { user } = useAuth();
  const { setIsCustomizePanelOpen } = useSettings();
  const [recentFiles, setRecentFiles] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentFiles');
    if (stored) {
      try {
        setRecentFiles(JSON.parse(stored).slice(0, 5));
      } catch (e) {
        console.error('Failed to parse recent files', e);
      }
    }
  }, []);

  const handleOpenFile = async () => {
    if (window.api) {
      const res = await window.api.openFile();
      if (res?.path) {
        const name = res.path.split(/[\\/]/).pop();
        const ext = name.split('.').pop().toLowerCase();
        const langMap = { py: 'python', c: 'c', cpp: 'cpp', java: 'java', js: 'javascript', ts: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown' };
        openTab({ path: res.path, name, content: res.content, language: langMap[ext] || 'plaintext' });
        addToRecent(name, res.path);
      }
    }
  };

  const handleOpenFolder = async () => {
    if (window.api) {
      const folder = await window.api.openFolder();
      if (folder) {
        const name = folder.split(/[\\/]/).pop();
        openProject({ name, path: folder });
      }
    }
  };

  const addToRecent = (name, path) => {
    const stored = localStorage.getItem('recentFiles');
    let files = [];
    if (stored) {
      try {
        files = JSON.parse(stored);
      } catch (e) {}
    }
    const filtered = files.filter(f => f.path !== path);
    const updated = [{ name, path }, ...filtered].slice(0, 10);
    localStorage.setItem('recentFiles', JSON.stringify(updated));
    setRecentFiles(updated.slice(0, 5));
  };

  const openRecent = async (file) => {
    if (window.api) {
      try {
        const res = await window.api.openFile(file.path);
        if (res && !res.error) {
          const ext = file.name.split('.').pop().toLowerCase();
          const langMap = { py: 'python', c: 'c', cpp: 'cpp', java: 'java', js: 'javascript', ts: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown' };
          openTab({ path: file.path, name: file.name, content: res.content, language: langMap[ext] || 'plaintext' });
          addToRecent(file.name, file.path);
        }
      } catch (e) {
        console.error('Failed to open recent file', e);
      }
    }
  };

  const ActionLink = ({ icon: Icon, label, onClick }) => (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: 'var(--accent-color)',
        fontSize: '14px',
        cursor: 'pointer',
        padding: '6px 0',
        transition: 'all 0.15s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.filter = 'brightness(1.2)';
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.filter = 'none';
        e.currentTarget.style.textDecoration = 'none';
      }}
    >
      <Icon size={18} strokeWidth={1.5} />
      <span>{label}</span>
    </div>
  );

  const WalkthroughItem = ({ icon: Icon, title, onClick, isNew = false }) => (
    <div 
      onClick={onClick}
      style={{
        background: '#1a1a2e',
        borderRadius: '6px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        border: '1px solid #2d2d44',
        transition: 'background 0.2s, border-color 0.2s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#252541';
        e.currentTarget.style.borderColor = 'var(--accent-color)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#1a1a2e';
        e.currentTarget.style.borderColor = '#2d2d44';
      }}
    >
      <div style={{ color: 'var(--accent-color)' }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 500 }}>{title}</span>
        {isNew && <span style={{ background: 'var(--accent-color)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>NEW</span>}
      </div>
    </div>
  );

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: '#0d0d18',
      color: '#e2e8f0',
      padding: '80px 100px',
      overflowY: 'auto',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
    }}>
      <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ 
                fontSize: '56px', 
                fontWeight: 200, // Keep thin weight
                color: '#fff', 
                margin: '0', 
                letterSpacing: '-1px',
                fontFamily: "'Outfit', 'Inter', sans-serif",
                lineHeight: 1
              }}>
                US IDE
              </h1>
              <p style={{ 
                fontSize: '18px', 
                color: 'var(--accent-color)', 
                margin: '8px 0 0 0', 
                fontWeight: 300, // Keep thin weight
                letterSpacing: '0.5px',
                opacity: 0.8
              }}>
                Created by Uday & Sujal
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '40px' 
        }}>
          
          {/* Left Column: Start & Recent */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <section>
              <h3 style={{ fontSize: '18px', fontWeight: 400, color: '#fff', marginBottom: '20px', opacity: 0.8 }}>Start</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ActionLink icon={Plus} label="New File..." onClick={() => openNewFileModal({ type: 'file' })} />
                <ActionLink icon={FileCode} label="Open File (System Dialog)" onClick={handleOpenFile} />
                <ActionLink icon={FolderOpen} label="Open Folder (System Dialog)" onClick={handleOpenFolder} />
                <ActionLink icon={Mic} label="Open by Voice..." onClick={() => setVoiceSearchOpen(true)} />
              </div>
            </section>

            <section>
              <h3 style={{ fontSize: '18px', fontWeight: 400, color: '#fff', marginBottom: '20px', opacity: 0.8 }}>Recent</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recentFiles.length > 0 ? (
                  recentFiles.map((file, i) => (
                    <div 
                      key={i} 
                      onClick={() => openRecent(file)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <div style={{ color: 'var(--accent-color)', fontSize: '14px', marginBottom: '2px' }}>{file.name}</div>
                      <div style={{ color: '#555570', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.path}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#555570', fontSize: '14px' }}>No recent folders</div>
                )}
                {recentFiles.length > 0 && (
                  <div style={{ color: 'var(--accent-color)', fontSize: '13px', marginTop: '4px', cursor: 'pointer' }}>More...</div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Walkthroughs */}
          <div style={{ flex: 1, minWidth: '250px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 400, color: '#fff', marginBottom: '20px', opacity: 0.8 }}>Walkthroughs</h3>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              width: '100%',
              maxWidth: '350px' // Control the width of the walkthrough list
            }}>
              <WalkthroughItem 
                icon={Zap} 
                title="Get started with US IDE" 
                onClick={() => {}}
              />
              <WalkthroughItem 
                icon={Bot} 
                title="user guidance" 
                onClick={() => openTab({
                  type: 'pdf',
                  name: 'User Guide',
                  path: '/user-guide.pdf',
                  content: '',
                  language: 'pdf'
                })}
              />
              <WalkthroughItem 
                icon={MessageSquare} 
                title="Meet US assistant" 
                isNew={true}
                onClick={() => {
                  console.log("AI Click - Current user in state:", user);
                  // Force a check against localStorage to be absolutely sure
                  const hasUser = !!localStorage.getItem('us_ide_user');
                  
                  if (!hasUser) {
                    console.log("No user found, showing login modal");
                    setShowLoginModal(true);
                  } else {
                    console.log("User found, showing AI panel");
                    setAiPanelVisible(true);
                  }
                }}
              />
              <WalkthroughItem 
                icon={Settings} 
                title="Customize your US" 
                onClick={() => setIsCustomizePanelOpen(true)}
              />
            </div>
            
            <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '10px', color: '#555570', fontSize: '13px' }}>
              <input type="checkbox" checked readOnly style={{ accentColor: 'var(--accent-color)', cursor: 'pointer' }} />
              <span>Show welcome page on startup</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WelcomeDashboard;
