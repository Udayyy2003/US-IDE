import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { 
  X, Palette, Layout, Bot, Code, RotateCcw, 
  Check, Monitor, Moon, Sun, Zap, Type, 
  AlignLeft, List, Eye
} from 'lucide-react';

const CustomizePanel = () => {
  const { settings, updateSettings, resetSettings, setIsCustomizePanelOpen } = useSettings();
  const [activeTab, setActiveTab] = useState('appearance');

  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '12px 8px',
        background: activeTab === id ? 'rgba(124,109,245,0.1)' : 'transparent',
        border: 'none',
        color: activeTab === id ? '#7c6df5' : '#888898',
        cursor: 'pointer',
        width: '100%',
        transition: 'all 0.2s',
        borderRight: activeTab === id ? '2px solid #7c6df5' : '2px solid transparent'
      }}
    >
      <Icon size={20} />
      <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
    </button>
  );

  const SectionTitle = ({ children }) => (
    <h3 style={{ fontSize: '12px', color: '#555570', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', marginTop: '24px' }}>
      {children}
    </h3>
  );

  const ControlRow = ({ label, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <span style={{ fontSize: '14px', color: '#d1d1e0' }}>{label}</span>
      {children}
    </div>
  );

  const OptionButton = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid',
        borderColor: active ? '#7c6df5' : '#2a2a3d',
        background: active ? 'rgba(124,109,245,0.1)' : 'rgba(255,255,255,0.03)',
        color: active ? '#7c6df5' : '#888898',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#0a0a0f',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid #1a1a28'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid #1a1a28'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Palette size={18} color="#7c6df5" />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Customize</h2>
        </div>
        <button 
          onClick={() => setIsCustomizePanelOpen(false)}
          style={{ background: 'none', border: 'none', color: '#555570', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar Tabs */}
        <div style={{ width: '80px', borderRight: '1px solid #1a1a28', background: 'rgba(0,0,0,0.2)' }}>
          <TabButton id="appearance" icon={Monitor} label="Style" />
          <TabButton id="layout" icon={Layout} label="Layout" />
          <TabButton id="ai" icon={Bot} label="AI" />
          <TabButton id="editor" icon={Code} label="Editor" />
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {activeTab === 'appearance' && (
            <div>
              <SectionTitle>Theme</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <OptionButton label="Dark" active={settings.theme === 'dark'} onClick={() => updateSettings({ theme: 'dark' })} />
                <OptionButton label="Light" active={settings.theme === 'light'} onClick={() => updateSettings({ theme: 'light' })} />
                <OptionButton label="Dracula" active={settings.theme === 'dracula'} onClick={() => updateSettings({ theme: 'dracula' })} />
                <OptionButton label="Monokai" active={settings.theme === 'monokai'} onClick={() => updateSettings({ theme: 'monokai' })} />
              </div>

              <SectionTitle>Accent Color</SectionTitle>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['#7c6df5', '#00e888', '#ff4d6d', '#00d4ff', '#ffb86c'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateSettings({ accentColor: color })}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: color,
                      border: settings.accentColor === color ? '2px solid #fff' : 'none',
                      cursor: 'pointer',
                      boxShadow: settings.accentColor === color ? `0 0 10px ${color}` : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div>
              <SectionTitle>Layout Mode</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <OptionButton label="Default (Standard)" active={settings.layout === 'default'} onClick={() => updateSettings({ layout: 'default' })} />
                <OptionButton label="Minimal (Focus)" active={settings.layout === 'minimal'} onClick={() => updateSettings({ layout: 'minimal' })} />
                <OptionButton label="Focus Mode (Fullscreen)" active={settings.layout === 'focus'} onClick={() => updateSettings({ layout: 'focus' })} />
                <OptionButton label="AI-First (Large Panel)" active={settings.layout === 'ai-first'} onClick={() => updateSettings({ layout: 'ai-first' })} />
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div>
              <SectionTitle>Automation</SectionTitle>
              <ControlRow label="Auto-create files">
                <input 
                  type="checkbox" 
                  checked={settings.aiAutoCreate} 
                  onChange={(e) => updateSettings({ aiAutoCreate: e.target.checked })}
                  style={{ accentColor: '#7c6df5' }}
                />
              </ControlRow>
              <ControlRow label="Auto-write strategy">
                <select 
                  value={settings.aiAutoWrite}
                  onChange={(e) => updateSettings({ aiAutoWrite: e.target.value })}
                  style={{ background: '#1a1a28', border: '1px solid #2a2a3d', color: '#fff', borderRadius: '4px', padding: '4px' }}
                >
                  <option value="on">Always Write</option>
                  <option value="ask">Ask First</option>
                </select>
              </ControlRow>

              <SectionTitle>Project Structure</SectionTitle>
              <div style={{ display: 'flex', gap: '10px' }}>
                <OptionButton label="Simple" active={settings.structureMode === 'simple'} onClick={() => updateSettings({ structureMode: 'simple' })} />
                <OptionButton label="Structured" active={settings.structureMode === 'structured'} onClick={() => updateSettings({ structureMode: 'structured' })} />
              </div>

              <SectionTitle>AI Verbosity</SectionTitle>
              <div style={{ display: 'flex', gap: '10px' }}>
                <OptionButton label="Short" active={settings.aiVerbosity === 'short'} onClick={() => updateSettings({ aiVerbosity: 'short' })} />
                <OptionButton label="Detailed" active={settings.aiVerbosity === 'detailed'} onClick={() => updateSettings({ aiVerbosity: 'detailed' })} />
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div>
              <SectionTitle>Typography</SectionTitle>
              <ControlRow label="Font Size">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="range" min="10" max="24" 
                    value={settings.fontSize}
                    onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                    style={{ accentColor: '#7c6df5', width: '80px' }}
                  />
                  <span style={{ fontSize: '12px', color: '#888898', width: '20px' }}>{settings.fontSize}</span>
                </div>
              </ControlRow>
              <ControlRow label="Font Family">
                <select 
                  value={settings.fontFamily}
                  onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                  style={{ background: '#1a1a28', border: '1px solid #2a2a3d', color: '#fff', borderRadius: '4px', padding: '4px' }}
                >
                  <option value="JetBrains Mono">JetBrains Mono</option>
                  <option value="Fira Code">Fira Code</option>
                  <option value="Consolas">Consolas</option>
                  <option value="monospace">Standard</option>
                </select>
              </ControlRow>

              <SectionTitle>View Settings</SectionTitle>
              <ControlRow label="Line Numbers">
                <input 
                  type="checkbox" 
                  checked={settings.lineNumbers} 
                  onChange={(e) => updateSettings({ lineNumbers: e.target.checked })}
                  style={{ accentColor: '#7c6df5' }}
                />
              </ControlRow>
              <ControlRow label="Word Wrap">
                <input 
                  type="checkbox" 
                  checked={settings.wordWrap} 
                  onChange={(e) => updateSettings({ wordWrap: e.target.checked })}
                  style={{ accentColor: '#7c6df5' }}
                />
              </ControlRow>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        padding: '16px 20px', 
        borderTop: '1px solid #1a1a28',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={resetSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#555570',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ff4d6d'}
          onMouseLeave={e => e.currentTarget.style.color = '#555570'}
        >
          <RotateCcw size={14} />
          <span>Reset to Default</span>
        </button>
      </div>
    </div>
  );
};

export default CustomizePanel;
