import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useIDE } from '../contexts/IDEContext'
import { useFiles } from '../contexts/FileContext'
import { useTabs } from '../contexts/TabContext'
import { useEditor } from '../contexts/EditorContext'
import NewFileFolderModal from './NewFileFolderModal'
import * as api from '../utils/api'
import { getFileIcon, getIconColor } from '../utils/fileIcons'
import { FaFileAlt, FaFolder, FaSyncAlt } from 'react-icons/fa'

// ─── Language detection from file extension ───
const EXT_LANG_MAP = {
  py: 'python', c: 'c', cpp: 'cpp', java: 'java',
  js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
  html: 'html', css: 'css', json: 'json', md: 'markdown',
  txt: 'plaintext', xml: 'xml', yaml: 'yaml', yml: 'yaml',
}
const getLang = (name) => EXT_LANG_MAP[name.split('.').pop()?.toLowerCase()] || 'plaintext'

// ─── Context Menu (right-click) ───────────────
function ContextMenu({ x, y, item, onClose, onCreateFile, onCreateFolder, onRename, onDelete }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const MenuItem = ({ label, icon, onClick, danger }) => (
    <button
      onClick={() => { onClick(); onClose() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '6px 12px', background: 'none',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        fontSize: 12, color: danger ? '#ff4d6d' : '#c8c8d8',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(255,77,109,0.1)' : 'rgba(124,109,245,0.1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <span>{icon}</span><span>{label}</span>
    </button>
  )

  return (
    <div ref={menuRef} style={{
      position: 'fixed', left: x, top: y, zIndex: 9999,
      background: '#1a1a28', border: '1px solid #2a2a3d',
      borderRadius: 8, padding: '4px 0', minWidth: 160,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {item?.isDirectory && (
        <>
          <MenuItem label="New File" icon={<FaFileAlt size={12} />} onClick={onCreateFile} />
          <MenuItem label="New Folder" icon={<FaFolder size={12} color="#e8c547" />} onClick={onCreateFolder} />
          <div style={{ height: 1, background: '#2a2a3d', margin: '4px 0' }} />
        </>
      )}
      <MenuItem label={`Rename (F2)`} icon="✏️" onClick={onRename} />
      <MenuItem label="Delete" icon="🗑️" onClick={onDelete} danger />
    </div>
  )
}

// ─── Single tree item ─────────────────────────
function TreeItem({
  item, level, onFileClick, currentFile, selectedFile, setSelectedFile, workspaceRoot, onRefresh,
  onRequestNewFile, onRequestNewFolder, onRequestRename, onRequestDelete,
  refreshToken,
}) {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(false)
  const [ctx, setCtx] = useState(null)

  const isElectron = !!window.api

  const loadChildren = async () => {
    setLoading(true)
    try {
      let res;
      if (window.api) {
        res = await window.api.readDir(item.path)
      } else {
        // Fallback: use file-tree API if it exists, or handle differently
        // For now, let's assume we use the recursive tree from FileContext if in browser
        // but since we want individual directory loading:
        const flaskRes = await fetch('http://localhost:5000/api/file-tree', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ root_path: item.path })
        });
        const data = await flaskRes.json();
        res = { success: true, files: data };
      }

      if (res.success) {
        setChildren(res.files.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
          return a.name.localeCompare(b.name)
        }))
      }
    } catch (e) {
      console.error("Error loading children:", e)
    } finally {
      setLoading(false)
    }
  }

  const toggle = async (e) => {
    e.stopPropagation()
    if (!item.isDirectory) return
    if (!expanded && children.length === 0) await loadChildren()
    setExpanded(v => !v)
  }

  // Refresh children when parent signals tree refresh
  useEffect(() => {
    if (expanded && item.isDirectory) {
      loadChildren()
    } else {
      setChildren([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken])

  const onRightClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedFile(item)
    setCtx({ x: e.clientX, y: e.clientY })
  }

  const doCreateFile = async () => {
    const baseDir = item.isDirectory ? item.path : workspaceRoot
    onRequestNewFile?.(baseDir, async () => {
      if (item.isDirectory) {
        await loadChildren()
        if (!expanded) setExpanded(true)
      }
      onRefresh?.()
    })
  }

  const doCreateFolder = async () => {
    onRequestNewFolder?.(item.path, async () => {
      await loadChildren()
      if (!expanded) setExpanded(true)
    })
  }

  const doRename = async () => {
    onRequestRename?.(item.path, item.name, () => onRefresh?.())
  }

  const doDelete = async () => {
    onRequestDelete?.(item.path, item.name, () => onRefresh?.())
  }

  const isActive = currentFile === item.path
  const isSelected = selectedFile?.path === item.path

  const handleClick = (e) => {
    e.stopPropagation()
    setSelectedFile(item)
    if (item.isDirectory) {
      toggle(e)
    } else {
      onFileClick(item)
    }
  }

  const IconComponent = getFileIcon(item.name, item.isDirectory)
  const iconColor = getIconColor(item.name, item.isDirectory)

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={onRightClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: `3px 8px 3px ${16 + level * 14}px`,
          cursor: 'pointer',
          background: isActive ? 'rgba(124,109,245,0.15)' : isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
          borderLeft: isActive ? '2px solid #7c6df5' : '2px solid transparent',
          userSelect: 'none',
          transition: 'background 0.1s',
        }}
        className="file-item"
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        {item.isDirectory && (
          <span style={{ fontSize: 9, color: '#555570', transform: expanded ? 'rotate(90deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.1s', marginRight: 2, marginLeft: -4 }}>▶</span>
        )}
        <IconComponent size={18} color={iconColor} />
        <span style={{ fontSize: 12, color: isActive ? '#e8e8f0' : '#aaaacc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </span>
        {loading && <span style={{ fontSize: 10, color: '#555570' }}>…</span>}
      </div>

      {item.isDirectory && expanded && (
        <div>
          {children.map(child => (
            <TreeItem
              key={child.path}
              item={child}
              level={level + 1}
              onFileClick={onFileClick}
              currentFile={currentFile}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              workspaceRoot={workspaceRoot}
              onRefresh={onRefresh}
              refreshToken={refreshToken}
              onRequestNewFile={onRequestNewFile}
              onRequestNewFolder={onRequestNewFolder}
              onRequestRename={onRequestRename}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </div>
      )}

      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y} item={item}
          onClose={() => setCtx(null)}
          onCreateFile={doCreateFile}
          onCreateFolder={doCreateFolder}
          onRename={doRename}
          onDelete={doDelete}
        />
      )}
    </>
  )
}

// ─── FileExplorer root ────────────────────────
export default function FileExplorer() {
  const {
    newFileFolderModal, setNewFileFolderModal,
    confirmNewFileFolder,
  } = useIDE()

  const {
    currentProject, workspaceRoot,
    fileTree, loadFiles, loading, refreshToken,
    selectedFile, setSelectedFile
  } = useFiles()

  const {
    openTab, closeTab, tabs, setTabs
  } = useTabs()

  const { currentFile } = useEditor()

  const isElectron = typeof window !== 'undefined' && !!window.api
  const [nameDlg, setNameDlg] = useState(null) // {title, initial, onSubmit}
  const [confirmDlg, setConfirmDlg] = useState(null) // {message, onConfirm}

  const requestName = useCallback((title, initial, onSubmit) => {
    setNameDlg({ title, initial, onSubmit })
  }, [])

  const requestConfirm = useCallback((message, onConfirm) => {
    setConfirmDlg({ message, onConfirm })
  }, [])

  const handleRequestRename = useCallback((targetPath, currentName, after) => {
    requestName(`Rename "${currentName}" to:`, currentName, async (value) => {
      const clean = value.trim()
      if (!clean || clean === currentName || /[\\/]|^\.+$|\.{2}/.test(clean)) return false
      
      let res;
      try {
        if (window.api) {
          res = await window.api.renameFile(workspaceRoot || currentProject?.path, targetPath, clean)
        } else {
          const apiRes = await api.renameFile(targetPath, clean)
          res = apiRes.data
        }

        if (res.success) {
          const newPath = res.path;
          const newLang = getLang(clean)
          
          // Update tabs
          setTabs(prev => prev.map(t => {
            if (t.path === targetPath) {
              return { ...t, path: newPath, name: clean, language: newLang };
            }
            // Also update children paths if it was a directory
            if (t.path.startsWith(targetPath + '\\') || t.path.startsWith(targetPath + '/')) {
              const sub = t.path.substring(targetPath.length);
              const separator = t.path.includes('\\') ? '\\' : '/';
              return { ...t, path: newPath + sub };
            }
            return t;
          }));

          await after?.()
          return true
        } else {
          alert(`Rename failed: ${res.error || 'Unknown error'}`);
          return false
        }
      } catch (err) {
        console.error("Rename exception:", err);
        alert(`Rename error: ${err.message}`);
        return false;
      }
    })
  }, [workspaceRoot, currentProject?.path, setTabs, requestName])

  const handleRequestDelete = useCallback((targetPath, currentName, after) => {
    requestConfirm(`Delete "${currentName}"?`, async () => {
      let res;
      if (window.api) {
        res = await window.api.deleteFile(workspaceRoot || currentProject?.path, targetPath)
      } else {
        const apiRes = await api.deleteFile(targetPath)
        res = apiRes.data
      }

      if (res.success) {
        const tabIndex = tabs.findIndex(t => t.path === targetPath)
        if (tabIndex > -1) {
          closeTab(tabIndex)
        }
        await after?.()
      }
      return res.success
    })
  }, [workspaceRoot, currentProject?.path, tabs, closeTab, requestConfirm])

  const handleFileClick = async (item) => {
    let res;
    if (window.api) {
      res = await window.api.openFile(item.path)
    } else {
      const apiRes = await api.loadFile(item.path)
      res = apiRes.data
    }

    if (!res || res.error) return
    openTab({ path: item.path, name: item.name, content: res.content || '', language: getLang(item.name) })
  }

  const handleCreateFile = async () => {
    if (!currentProject?.path) return
    requestName('New file name (e.g. main.py)', '', async (value) => {
      const clean = value.trim()
      if (!clean || /[\\/]|^\.+$|\.{2}/.test(clean)) return false
      const fullPath = `${currentProject?.path}\\${clean}`
      
      let res;
      if (window.api) {
        res = await window.api.createFile(workspaceRoot || currentProject?.path, fullPath)
      } else {
        const apiRes = await api.createFile(workspaceRoot || currentProject?.path, fullPath)
        res = apiRes.data
      }

      if (res.success) {
        openTab({ path: fullPath, name: clean, content: '', language: getLang(clean) })
        loadFiles()
      }
      return res.success
    })
  }

  const handleCreateFolder = async () => {
    if (!currentProject?.path) return
    requestName('New folder name', '', async (value) => {
      const clean = value.trim()
      if (!clean || /[\\/]|^\.+$|\.{2}/.test(clean)) return false
      const fullPath = `${currentProject?.path}\\${clean}`
      
      let res;
      if (window.api) {
        res = await window.api.createFolder(workspaceRoot || currentProject?.path, fullPath)
      } else {
        const apiRes = await api.createFolder(workspaceRoot || currentProject?.path, fullPath)
        res = apiRes.data
      }

      if (res.success) loadFiles()
      return res.success
    })
  }

  // Keyboard shortcuts (F2 for rename, Delete for delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedFile || nameDlg || confirmDlg) return;

      if (e.key === 'F2') {
        e.preventDefault();
        handleRequestRename(selectedFile.path, selectedFile.name, loadFiles);
      } else if (e.key === 'Delete') {
        e.preventDefault();
        handleRequestDelete(selectedFile.path, selectedFile.name, loadFiles);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, handleRequestRename, handleRequestDelete, loadFiles, nameDlg, confirmDlg]);

  // Load on project change
  useEffect(() => {
    if (currentProject?.path) {
      loadFiles();
    }
  }, [currentProject?.path, loadFiles])

  // Watch for external changes
  useEffect(() => {
    if (!currentProject?.path || !window.api?.watchDir) return
    window.api.watchDir(currentProject.path)
    const cleanup = window.api.onDirChanged(() => loadFiles())
    return () => {
      cleanup?.()
      window.api.unwatchDir?.(currentProject.path)
    }
  }, [currentProject?.path, loadFiles])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d18', userSelect: 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px 8px 14px', borderBottom: '1px solid #1f1f2e', flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#555570', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {currentProject ? currentProject.name : 'Explorer'}
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          <IconBtn title="New File" onClick={handleCreateFile}><FaFileAlt size={12} /></IconBtn>
          <IconBtn title="New Folder" onClick={handleCreateFolder}><FaFolder size={12} color="#e8c547" /></IconBtn>
          <IconBtn title="Refresh" onClick={loadFiles}><FaSyncAlt size={12} /></IconBtn>
        </div>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#555570', fontSize: 12 }}>Loading…</div>
        ) : !currentProject ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
              <FaFolder color="#2a2a3d" />
            </div>
            <div style={{ color: '#555570', fontSize: 11 }}>No folder open</div>
          </div>
        ) : (
          fileTree.map(item => (
            <TreeItem
              key={item.path}
              item={item}
              level={0}
              onFileClick={handleFileClick}
              currentFile={currentFile}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              workspaceRoot={workspaceRoot || currentProject?.path}
              onRefresh={loadFiles}
              refreshToken={refreshToken}
              onRequestNewFile={(dirPath) => setNewFileFolderModal({ isOpen: true, type: 'file', initialPath: dirPath, initialName: '' })}
              onRequestNewFolder={(dirPath) => setNewFileFolderModal({ isOpen: true, type: 'folder', initialPath: dirPath, initialName: '' })}
              onRequestRename={handleRequestRename}
              onRequestDelete={handleRequestDelete}
            />
          ))
        )}
      </div>
      {newFileFolderModal.isOpen && (
        <NewFileFolderModal
          isOpen={newFileFolderModal.isOpen}
          onClose={() => setNewFileFolderModal({ ...newFileFolderModal, isOpen: false })}
          onConfirm={confirmNewFileFolder}
          initialName={newFileFolderModal.initialName}
          initialPath={newFileFolderModal.initialPath}
          type={newFileFolderModal.type}
        />
      )}
      {nameDlg && (
        <InputDialog
          title={nameDlg.title}
          initial={nameDlg.initial || ''}
          onCancel={() => setNameDlg(null)}
          onSubmit={async (val) => {
            const ok = await nameDlg.onSubmit?.(val || '')
            if (ok) setNameDlg(null)
          }}
        />
      )}
      {confirmDlg && (
        <ConfirmDialog
          message={confirmDlg.message}
          onCancel={() => setConfirmDlg(null)}
          onConfirm={async () => {
            const ok = await confirmDlg.onConfirm?.()
            if (ok !== false) setConfirmDlg(null)
          }}
        />
      )}
    </div>
  )
}

function IconBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '3px 5px', borderRadius: 4, fontSize: 12,
        color: '#555570', transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = '#e8e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#555570'; e.currentTarget.style.background = 'none' }}
    >
      {children}
    </button>
  )
}

// ─── Minimal input dialog (no browser prompt) ────────────────────────────────
function InputDialog({ title, initial, onSubmit, onCancel }) {
  const [value, setValue] = useState(initial || '')
  const inputRef = useRef(null)

  useEffect(() => {
    // Select the text when the dialog opens for easier renaming
    if (inputRef.current) {
      inputRef.current.focus()
      const dotIndex = value.lastIndexOf('.')
      if (dotIndex > 0) {
        inputRef.current.setSelectionRange(0, dotIndex)
      } else {
        inputRef.current.select()
      }
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
      <div style={{ width: 360, background: '#13131e', border: '1px solid #2a2a3d', borderRadius: 12, padding: 14 }}>
        <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{title}</div>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onSubmit?.(value)
            if (e.key === 'Escape') onCancel?.()
          }}
          style={{ width: '100%', padding: '8px 10px', background: '#080810', border: '1px solid #2a2a3d', color: '#e8e8f0', borderRadius: 8, outline: 'none' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <button
            onClick={onCancel}
            className="dialog-btn"
            style={{ background: 'none', border: '1px solid #2a2a3d', color: '#aaaacc', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit?.(value)}
            className="dialog-btn"
            style={{ background: '#7c6df5', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  const okBtnRef = useRef(null)
  useEffect(() => { okBtnRef.current?.focus() }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
      <div style={{ width: 340, background: '#13131e', border: '1px solid #2a2a3d', borderRadius: 12, padding: 14 }}>
        <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <button
            onClick={onCancel}
            className="dialog-btn"
            onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
            style={{ background: 'none', border: '1px solid #2a2a3d', color: '#aaaacc', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            ref={okBtnRef}
            onClick={onConfirm}
            className="dialog-btn"
            onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
            style={{ background: '#ff4d6d', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
