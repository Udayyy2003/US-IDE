import React, { useState, useEffect, useRef } from 'react';
import { useIDE } from '../contexts/IDEContext';
import { useFiles } from '../contexts/FileContext';
import { useTabs } from '../contexts/TabContext';

// ─── Language detection from file extension ───
const EXT_LANG_MAP = {
  py: 'python', c: 'c', cpp: 'cpp', java: 'java',
  js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
  html: 'html', css: 'css', json: 'json', md: 'markdown',
  txt: 'plaintext', xml: 'xml', yaml: 'yaml', yml: 'yaml',
}
const getLang = (name) => EXT_LANG_MAP[name.split('.').pop()?.toLowerCase()] || 'plaintext'

const FileSearchModal = () => {
  const { voiceSearchOpen, setVoiceSearchOpen } = useIDE();
  const { fileTree, currentProject } = useFiles();
  const { openTab } = useTabs();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchMode, setSearchMode] = useState('filename'); // 'filename' | 'content'
  const [contentResults, setContentResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (voiceSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setErrorMessage('');
      setSearchMode('filename');
      setContentResults([]);
    }
  }, [voiceSearchOpen]);

  // Perform search when mode or query changes
  useEffect(() => {
    if (searchMode === 'content' && searchQuery.length >= 3) {
      const delayDebounce = setTimeout(async () => {
        setLoading(true);
        try {
          const response = await fetch('http://localhost:5000/api/search-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: searchQuery,
              root_path: currentProject?.path
            })
          });
          const data = await response.json();
          if (data.success) {
            setContentResults(data.results);
          }
        } catch (e) {
          console.error('[Search Error]', e);
        } finally {
          setLoading(false);
        }
      }, 400); // Debounce search
      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery, searchMode, currentProject]);

  const findFile = (query, files) => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return null;

    let matches = [];

    const traverse = (items) => {
      for (const item of items) {
        if (!item.isDirectory) {
          const fileName = item.name.toLowerCase();
          // Check for exact or partial match
          if (fileName === normalizedQuery || fileName.includes(normalizedQuery)) {
            matches.push(item);
          }
        }
        if (item.isDirectory && item.children) {
          traverse(item.children);
        }
      }
    };

    traverse(files);
    console.log("MATCHES:", matches);
    
    // Prioritize exact match if exists, otherwise return the first match
    const exactMatch = matches.find(m => m.name.toLowerCase() === normalizedQuery);
    return exactMatch || matches[0] || null;
  };

  const handleOpen = async (item = null) => {
    if (searchMode === 'filename') {
      const file = findFile(searchQuery, fileTree);
      if (file) {
        // Must read content and detect language before opening tab
        const res = await window.api?.openFile(file.path);
        if (res && !res.error) {
          openTab({ 
            path: file.path, 
            name: file.name, 
            content: res.content || '', 
            language: getLang(file.name) 
          });
          setVoiceSearchOpen(false);
        } else {
          setErrorMessage('Could not read file');
        }
      } else {
        setErrorMessage('File not found');
        // Clear error after 2 seconds
        setTimeout(() => setErrorMessage(''), 2000);
      }
    } else if (item) {
      // For content search, item is passed directly from list click
      const res = await window.api?.openFile(item.path);
      if (res && !res.error) {
        openTab({
          path: item.path,
          name: item.name,
          content: res.content || '',
          language: getLang(item.name)
        });
        setVoiceSearchOpen(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleOpen();
    } else if (e.key === 'Escape') {
      setVoiceSearchOpen(false);
    }
  };

  if (!voiceSearchOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={() => setVoiceSearchOpen(false)}
    >
      <div 
        style={{ 
          background: '#13131e', 
          padding: '24px', 
          borderRadius: 16, 
          border: '1px solid #2a2a3d',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          width: 520,
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setSearchMode('filename')}
            style={{
              background: searchMode === 'filename' ? 'rgba(124,109,245,0.15)' : 'transparent',
              border: `1px solid ${searchMode === 'filename' ? '#7c6df5' : '#2a2a3d'}`,
              color: searchMode === 'filename' ? '#7c6df5' : '#aaaacc',
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600
            }}
          >
            Filename
          </button>
          <button
            onClick={() => setSearchMode('content')}
            style={{
              background: searchMode === 'content' ? 'rgba(124,109,245,0.15)' : 'transparent',
              border: `1px solid ${searchMode === 'content' ? '#7c6df5' : '#2a2a3d'}`,
              color: searchMode === 'content' ? '#7c6df5' : '#aaaacc',
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600
            }}
          >
            Deep Search (Content)
          </button>
        </div>
        
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchMode === 'filename' ? "Type file name..." : "Search inside all files..."}
            style={{
              width: '100%',
              background: '#0a0a0f',
              border: `1px solid ${errorMessage ? '#ff4d6d' : '#2a2a3d'}`,
              borderRadius: 10,
              padding: '14px 18px',
              color: '#e8e8f0',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {loading && (
            <div style={{ position: 'absolute', right: 15, top: 15, color: '#7c6df5' }}>
              <span className="search-loader">⌛</span>
            </div>
          )}
          {errorMessage && (
            <div style={{ position: 'absolute', bottom: -18, left: 2, color: '#ff4d6d', fontSize: 11 }}>
              {errorMessage}
            </div>
          )}
        </div>

        {searchMode === 'content' && searchQuery.length >= 3 && (
          <div style={{ 
            maxHeight: 300, overflowY: 'auto', textAlign: 'left', 
            background: '#0a0a0f', borderRadius: 10, marginBottom: 20,
            border: '1px solid #2a2a3d'
          }}>
            {contentResults.length > 0 ? (
              contentResults.map((res, i) => (
                <div 
                  key={i}
                  onClick={() => handleOpen(res)}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid #1a1a28',
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,109,245,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#e8e8f0', fontSize: 13, fontWeight: 600 }}>{res.name}</span>
                    <span style={{ color: '#555570', fontSize: 11 }}>Line {res.line}</span>
                  </div>
                  <div style={{ color: '#aaaacc', fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {res.preview}
                  </div>
                </div>
              ))
            ) : !loading && (
              <div style={{ padding: 20, textAlign: 'center', color: '#555570', fontSize: 12 }}>
                No matches found inside files
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setVoiceSearchOpen(false)}
            style={{
              background: '#1a1a28',
              border: '1px solid #2a2a3d',
              color: '#aaaacc',
              padding: '10px 0',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              flex: 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e8e8f0'; e.currentTarget.style.background = '#222235'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#aaaacc'; e.currentTarget.style.background = '#1a1a28'; }}
          >
            Cancel
          </button>
          <button 
            onClick={handleOpen}
            style={{
              background: '#7c6df5',
              border: 'none',
              color: '#fff',
              padding: '10px 0',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              flex: 1,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#8b80ff'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#7c6df5'}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileSearchModal;
