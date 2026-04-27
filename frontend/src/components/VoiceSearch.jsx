import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useIDE } from '../contexts/IDEContext';
import { useFiles } from '../contexts/FileContext';
import { useTabs } from '../contexts/TabContext';

// ─── Language detection from file extension ───
const EXT_LANG_MAP = {
  py: 'python', c: 'c', cpp: 'cpp', java: 'java',
  js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
  html: 'html', css: 'css', json: 'json', md: 'markdown',
  txt: 'plaintext', xml: 'xml', yaml: 'yaml', yml: 'yaml',
};
const getLang = (name) => EXT_LANG_MAP[name.split('.').pop()?.toLowerCase()] || 'plaintext';

const VoiceSearch = ({ onFallback, fileTree: propFileTree }) => {
  const { voiceSearchOpen, setVoiceSearchOpen } = useIDE();
  const { fileTree: contextFileTree } = useFiles();
  const { openTab } = useTabs();
  
  const fileTree = propFileTree || contextFileTree;

  const [status, setStatus] = useState('idle'); // 'idle' | 'recording' | 'processing' | 'error'
  const [message, setMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const inputRef = useRef(null);

  // ─── Whisper Backend Integration ──────────────────────────
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ─── Helper: Normalize Spoken Text ───────────────────────
  const normalize = (text) => 
    text.toLowerCase()
      .replace("open", "")
      .trim()
      .replace(/\s/g, "")
      .replace(/dot/g, ".")
      .replace(/plusplus/g, "++")
      .replace(/[.,?!]$/, ""); // Remove trailing punctuation

  // ─── Helper: File Search Logic (Recursive) ───────────────
  const findFile = useCallback((nodes, spokenName) => {
    if (!nodes || !spokenName) return null;
    const target = normalize(spokenName);

    let firstMatch = null;

    const searchRecursive = (tree) => {
      for (const node of tree) {
        if (!node.isDirectory) {
          const name = normalize(node.name);
          // 1. Exact match (prefer this)
          if (name === target) {
            return node;
          }
          // 2. Partial match (save as firstMatch if not already set)
          if (!firstMatch && name.includes(target)) {
            firstMatch = node;
          }
        }

        if (node.isDirectory && node.children) {
          const found = searchRecursive(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const exactMatch = searchRecursive(nodes);
    return exactMatch || firstMatch;
  }, []);

  const performSearch = useCallback(async (query) => {
    if (!query.trim()) return;

    setStatus('processing');
    setMessage(`Searching for "${query}"...`);
    
    const file = findFile(fileTree, query);

    if (file) {
      const api = window.api || window.electron;
      const res = await api?.openFile(file.path);
      
      if (res && !res.error) {
        openTab({ 
          path: file.path, 
          name: file.name, 
          content: res.content || '', 
          language: getLang(file.name) 
        });
        setVoiceSearchOpen(false);
      } else {
        setStatus('error');
        setMessage('Could not open file.');
      }
    } else {
      setStatus('error');
      setMessage(`File "${query}" not found.`);
    }
  }, [fileTree, openTab, setVoiceSearchOpen, findFile]);

  // ─── Recording Logic ─────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setStatus('processing');
        setMessage('Transcribing...');
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice.webm');

        try {
          const res = await fetch('http://localhost:5000/voice-to-text', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (data.text) {
            console.log("TRANSCRIPT:", data.text);
            setTranscript(data.text);
            performSearch(data.text);
          } else {
            throw new Error(data.error || 'Transcription failed');
          }
        } catch (err) {
          console.error("Transcription error:", err);
          setStatus('error');
          setMessage("Failed to transcribe. Check if backend is running.");
        } finally {
          // Stop all tracks in the stream
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setStatus('recording');
      setMessage('Listening...');
    } catch (err) {
      console.error("Mic access error:", err);
      setStatus('error');
      setMessage("Microphone access denied or not found.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!voiceSearchOpen) {
      setTranscript('');
      setStatus('idle');
      setMessage('');
      stopRecording();
    }
  }, [voiceSearchOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (voiceSearchOpen) {
      const timer = setTimeout(() => { 
        if (inputRef.current) { 
          inputRef.current.focus(); 
        } 
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [voiceSearchOpen]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    performSearch(transcript);
  };

  if (!voiceSearchOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={() => setVoiceSearchOpen(false)}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#13131e', padding: '32px', borderRadius: 16,
          border: '1px solid #2a2a3d', textAlign: 'center', width: 360,
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', gap: '20px'
        }}
      >
        <div 
          onClick={status === 'recording' ? stopRecording : startRecording}
          style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto',
            background: status === 'recording' ? 'rgba(255,77,109,0.1)' : 'rgba(124,109,245,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${status === 'recording' ? '#ff4d6d' : '#2a2a3d'}`,
            cursor: 'pointer',
            animation: status === 'recording' ? 'pulse-ring-red 1.5s infinite' : 'none',
            transition: 'all 0.2s'
          }}
          title={status === 'recording' ? 'Stop Recording' : 'Start Voice Search'}
        >
          {status === 'recording' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff4d6d">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#aaaacc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </div>

        <div>
          <h3 style={{ color: '#e8e8f0', margin: '0 0 4px', fontSize: 18 }}>Voice Search</h3>
          <p style={{ 
            color: status === 'error' ? '#ff4d6d' : (status === 'recording' ? '#7c6df5' : '#aaaacc'), 
            fontSize: 13, margin: 0 
          }}>
            {message || (status === 'recording' ? 'Listening...' : 'Click mic to speak file name')}
          </p>
        </div>

        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
          <label style={{ color: '#555570', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            File Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="e.g. main.py or folder/utils.js"
            style={{
              width: '100%', background: '#0a0a0f', border: '1px solid #2a2a3d',
              borderRadius: 8, padding: '12px 14px', color: '#e8e8f0',
              fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7c6df5'}
            onBlur={(e) => e.target.style.borderColor = '#2a2a3d'}
          />
        </form>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button"
            onClick={() => setVoiceSearchOpen(false)}
            style={{
              flex: 1, background: 'transparent', border: '1px solid #2a2a3d',
              color: '#aaaacc', padding: '10px', borderRadius: 8,
              cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleManualSubmit}
            disabled={!transcript.trim() || status === 'processing' || status === 'recording'}
            style={{
              flex: 1, background: '#7c6df5', border: 'none',
              color: '#fff', padding: '10px', borderRadius: 8,
              cursor: transcript.trim() ? 'pointer' : 'not-allowed', 
              fontSize: 14, fontWeight: 600, transition: 'background 0.2s',
              opacity: transcript.trim() ? 1 : 0.5
            }}
          >
            Open File
          </button>
        </div>
      </div>
      <style>{`
        @keyframes pulse-ring-red {
          0% { box-shadow: 0 0 0 0 rgba(255,77,109,0.4); }
          70% { box-shadow: 0 0 0 15px rgba(255,77,109,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,77,109,0); }
        }
      `}</style>
    </div>
  );
};

export default VoiceSearch;
