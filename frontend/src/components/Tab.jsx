import React from 'react';
import { useTabs } from '../contexts/TabContext';
import { getFileIcon, getIconColor } from '../utils/fileIcons';

const Tab = ({ tab, index }) => {
  const { activeTabIndex, setActiveTabIndex } = useTabs();
  
  const isActive = index === activeTabIndex;
  const Icon = getFileIcon(tab.name, false);
  const iconColor = getIconColor(tab.name, false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        background: isActive ? '#0d0d18' : 'transparent',
        borderRight: '1px solid #1f1f2e',
        cursor: 'pointer',
        userSelect: 'none',
        height: '100%',
        minWidth: 120,
        maxWidth: 200,
        position: 'relative',
        transition: 'background 0.1s',
      }}
      onClick={() => setActiveTabIndex(index)}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      className="tab-item"
    >
      {/* Active tab bottom indicator */}
      {isActive && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2, background: '#7c6df5',
        }} />
      )}

      {/* Icon */}
      <span style={{ display: 'flex', alignItems: 'center', marginRight: 8 }}>
        <Icon size={14} color={iconColor} />
      </span>

      {/* File name */}
      <span style={{ 
        fontSize: 12, 
        color: isActive ? '#e8e8f0' : '#777798',
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap',
        flex: 1,
      }}>
        {tab.name}
      </span>

      {/* Unsaved dot */}
      {tab.unsaved && (
        <span style={{ marginLeft: 8, color: '#7c6df5', fontSize: 14, lineHeight: 1 }} title="Unsaved changes">●</span>
      )}

      {/* Close button */}
      <button
        className="tab-close-btn"
        style={{
          marginLeft: 8,
          background: 'none',
          border: 'none',
          color: '#555570',
          cursor: 'pointer',
          fontSize: 16,
          padding: '4px',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          transition: 'all 0.2s ease',
          opacity: isActive ? 1 : 0,
        }}
        onClick={(e) => {
          e.stopPropagation();
          // We need handleCloseTab here. Since I can't easily change all contexts now, 
          // I will use a custom event or check how IDEPage passes it.
          // Wait, Tab is used in TabBar, which is used in IDEPage.
          // I'll add handleCloseTab to IDEContext to make it available everywhere.
          window.dispatchEvent(new CustomEvent('close-tab', { detail: { index } }));
        }}
        onMouseEnter={e => { 
          e.currentTarget.style.color = '#ff4d4d'; // Red on hover
          e.currentTarget.style.background = 'rgba(255,77,77,0.15)'; 
        }}
        onMouseLeave={e => { 
          e.currentTarget.style.color = '#555570'; 
          e.currentTarget.style.background = 'none'; 
        }}
      >
        ×
      </button>

      <style>{`
        .tab-item:hover .tab-close-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default Tab;
