import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaFolder } from 'react-icons/fa';

const NewFileFolderModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialName = '',
  initialPath = '',
  type = 'file', // 'file' or 'folder'
}) => {
  const [mode, setMode] = useState(type);
  const [name, setName] = useState(initialName);
  const [path, setPath] = useState(initialPath);
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(type);
    setName(initialName);
    setPath(initialPath);
    setError('');
  }, [isOpen, initialName, initialPath, type]);

  if (!isOpen) return null;

  const handlePathSelect = async () => {
    try {
      const selectedPath = await window.api.selectFolder();
      if (selectedPath) {
        setPath(selectedPath);
      }
    } catch (e) {
      setError('Failed to select folder.');
      console.error('Error selecting folder:', e);
    }
  };

  const handleConfirm = () => {
    if (!name.trim()) {
      setError(`Please enter a ${mode} name.`);
      return;
    }
    if (!path.trim()) {
      setError('Please select a location.');
      return;
    }
    setError('');
    onConfirm(name.trim(), path.trim(), mode);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 5000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#13131e', border: '1px solid #2a2a40',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 0 60px rgba(124,109,245,0.2)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #1f1f2e' }}>
          <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: 16 }}>
            New {mode === 'file' ? 'File' : 'Folder'}
          </div>
        </div>

        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <button
              onClick={() => setMode('file')}
              style={{
                flex: 1, padding: '8px', borderRadius: 8,
                background: mode === 'file' ? '#7c6df5' : 'rgba(255,255,255,0.05)',
                color: mode === 'file' ? '#fff' : '#aaaacc',
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            ><FaFileAlt size={12} /> File</button>
            <button
              onClick={() => setMode('folder')}
              style={{
                flex: 1, padding: '8px', borderRadius: 8,
                background: mode === 'folder' ? '#7c6df5' : 'rgba(255,255,255,0.05)',
                color: mode === 'folder' ? '#fff' : '#aaaacc',
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            ><FaFolder size={12} /> Folder</button>
          </div>

          {error && (
            <div style={{ marginBottom: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', color: '#ff4d6d', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Name Input */}
          <div>
            <label style={{ color: '#aaaacc', fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>
              {mode === 'file' ? 'File Name' : 'Folder Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === 'file' ? 'e.g. main.py' : 'e.g. my-components'}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7c6df5'}
              onBlur={e => e.target.style.borderColor = '#2a2a3d'}
            />
          </div>

          {/* Path Input */}
          <div>
            <label style={{ color: '#aaaacc', fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>
              Location
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="Select a folder..."
                style={{ ...inputStyle, flex: 1 }}
                onFocus={e => e.target.style.borderColor = '#7c6df5'}
                onBlur={e => e.target.style.borderColor = '#2a2a3d'}
              />
              <button
                onClick={handlePathSelect}
                style={{
                  ...buttonStyle,
                  background: '#7c6df5', color: '#fff',
                  padding: '8px 14px', borderRadius: 8,
                }}
              >
                Browse
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button onClick={onClose} style={{ ...buttonStyle, background: 'none', border: '1px solid #2a2a3d', color: '#aaaacc' }}>
              Cancel
            </button>
            <button onClick={handleConfirm} style={{ ...buttonStyle, background: '#00e888', color: '#0a0a0f' }}>
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: '#0a0a0f',
  border: '1px solid #2a2a3d',
  borderRadius: 8,
  color: '#e8e8f0',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
};

const buttonStyle = {
  cursor: 'pointer',
  border: 'none',
  fontSize: 14,
  fontWeight: 500,
  padding: '10px 16px',
  borderRadius: 8,
  transition: 'background 0.2s, color 0.2s',
};

export default NewFileFolderModal;
