import React from 'react';

const SaveFileModal = ({ fileName, onSave, onDontSave, onCancel }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      <div style={{
        background: '#1e1e2e',
        width: '400px',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        border: '1px solid #33334d',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <h3 style={{ 
          color: '#fff', 
          margin: '0 0 12px 0', 
          fontSize: '18px',
          fontWeight: 600
        }}>
          Save changes?
        </h3>
        
        <p style={{ 
          color: '#94a3b8', 
          margin: '0 0 24px 0', 
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          Do you want to save the changes you made to <span style={{ color: '#7c6df5', fontWeight: 600 }}>{fileName}</span>?<br/>
          Your changes will be lost if you don't save them.
        </p>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '8px' 
        }}>
          <button
            onClick={onSave}
            style={{
              padding: '10px',
              background: '#7c6df5',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#6a5ae0'}
            onMouseLeave={e => e.currentTarget.style.background = '#7c6df5'}
          >
            Save
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onDontSave}
              style={{
                flex: 1,
                padding: '10px',
                background: '#2a2a3d',
                color: '#e2e8f0',
                border: '1px solid #3d3d5c',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#33334d'}
              onMouseLeave={e => e.currentTarget.style.background = '#2a2a3d'}
            >
              Don't Save
            </button>
            
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '10px',
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #33334d',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = '#4d4d70';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = '#33334d';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveFileModal;
