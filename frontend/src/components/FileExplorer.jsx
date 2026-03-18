import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useIDE } from '../contexts/IDEContext'

// ─── Language detection from file extension ───
const EXT_LANG_MAP = {
  py: 'python', c: 'c', cpp: 'cpp', java: 'java',
  js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
  html: 'html', css: 'css', json: 'json', md: 'markdown',
  txt: 'plaintext', xml: 'xml', yaml: 'yaml', yml: 'yaml',
}
const getLang = (name) => EXT_LANG_MAP[name.split('.').pop()?.toLowerCase()] || 'plaintext'

// ─── File icons ───────────────────────────────
const FILE_ICONS = {
  py: '🐍', c: '⚙️', cpp: '⚡', java: '☕', js: '🟡', ts: '🔷',
  jsx: '⚛️', tsx: '⚛️', html: '🌐', css: '🎨', json: '📋',
  md: '📝', txt: '📄', xml: '🔖', yaml: '⚙️', yml: '⚙️',
}
const getIcon = (name) => {
  const ext = name.split('.').pop()?.toLowerCase()
  return FILE_ICONS[ext] || '📄'
}

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
          <MenuItem label="New File" icon="📄" onClick={onCreateFile} />
          <MenuItem label="New Folder" icon="📁" onClick={onCreateFolder} />
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
  item, level, onFileClick, currentFile, workspaceRoot, onRefresh,
  onRequestNewFile, onRequestNewFolder, onRequestRename, onRequestDelete,
  refreshToken,
}) {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(false)
  const [ctx, setCtx] = useState(null)

  const loadChildren = async () => {
    setLoading(true)
    const res = await window.api.readDir(item.path)
    if (res.success) {
      setChildren(res.files.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name)
      }))
    }
    setLoading(false)
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

  return (
    <>
      <div
        onClick={() => item.isDirectory ? toggle({ stopPropagation: () => { } }) : onFileClick(item)}
        onContextMenu={onRightClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: `3px 8px 3px ${16 + level * 14}px`,
          cursor: 'pointer',
          background: isActive ? 'rgba(124,109,245,0.15)' : 'transparent',
          borderLeft: isActive ? '2px solid #7c6df5' : '2px solid transparent',
          userSelect: 'none',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        {item.isDirectory && (
          <span style={{ fontSize: 9, color: '#555570', transform: expanded ? 'rotate(90deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.1s', marginRight: 2, marginLeft: -4 }}>▶</span>
        )}
        <span style={{ fontSize: 13 }}>
          {item.isDirectory ? (expanded ? '📂' : '📁') : getIcon(item.name)}
        </span>
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
    currentProject, currentFile, openFileInTab,
    fileTree, setFileTree, workspaceRoot,
    openFiles, setOpenFiles, setCurrentFile, setCurrentLanguage,
  } = useIDE()
  const isElectron = typeof window !== 'undefined' && !!window.api
  const [loading, setLoading] = useState(false)
  const [nameDlg, setNameDlg] = useState(null) // {title, initial, onSubmit}
  const [confirmDlg, setConfirmDlg] = useState(null) // {message, onConfirm}
  const [refreshToken, setRefreshToken] = useState(0)

  const loadFiles = useCallback(async () => {
    const dir = currentProject?.path
    if (!dir) return
    setLoading(true)
    try {
      const res = await window.api.readDir(dir)
      if (res.success) {
        setFileTree(res.files.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
          return a.name.localeCompare(b.name)
        }))
        setRefreshToken(t => t + 1)
      }
    } finally {
      setLoading(false)
    }
  }, [currentProject?.path, setFileTree])

  // Load on project change
  useEffect(() => { loadFiles() }, [loadFiles])

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

  const handleFileClick = async (item) => {
    const res = await window.api.openFile(item.path)
    if (res?.error) return
    openFileInTab({ path: item.path, name: item.name, content: res.content, language: getLang(item.name) })
  }

  const requestName = (title, initial, onSubmit) => {
    setNameDlg({ title, initial, onSubmit })
  }

  const requestConfirm = (message, onConfirm) => {
    setConfirmDlg({ message, onConfirm })
  }

  const handleCreateFile = async () => {
    if (!currentProject?.path) return
    if (!isElectron) { alert('Use the Electron app to create files (npm run dev).'); return }
    requestName('New file name (e.g. main.py)', '', async (value) => {
      const clean = value.trim()
      if (!clean || /[\\/]|^\.+$|\.{2}/.test(clean)) return false
      const fullPath = `${currentProject.path}\\${clean}`
      const res = await window.api.createFile(workspaceRoot || currentProject.path, fullPath)
      if (res.success) {
        openFileInTab({ path: fullPath, name: clean, content: '', language: getLang(clean) })
        loadFiles()
      }
      return res.success
    })
  }

  const handleCreateFolder = async () => {
    if (!currentProject?.path) return
    if (!isElectron) { alert('Use the Electron app to create folders (npm run dev).'); return }
    requestName('New folder name', '', async (value) => {
      const clean = value.trim()
      if (!clean || /[\\/]|^\.+$|\.{2}/.test(clean)) return false
      const fullPath = `${currentProject.path}\\${clean}`
      const res = await window.api.createFolder(workspaceRoot || currentProject.path, fullPath)
      if (res.success) loadFiles()
      return res.success
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d18', userSelect: 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px 8px 14px', borderBottom: '1px solid #1f1f2e', flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#555570', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {currentProject ? currentProject.name : 'Explorer'}
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          <IconBtn title="New File" onClick={handleCreateFile}>📄</IconBtn>
          <IconBtn title="New Folder" onClick={handleCreateFolder}>📁</IconBtn>
          <IconBtn title="Refresh" onClick={loadFiles}>🔄</IconBtn>
        </div>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#555570', fontSize: 12 }}>Loading…</div>
        ) : !currentProject ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
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
              workspaceRoot={workspaceRoot || currentProject?.path}
              onRefresh={loadFiles}
              refreshToken={refreshToken}
              onRequestNewFile={(dirPath, after) => requestName('New file name', '', async (value) => {
                const clean = value.trim()
                if (!clean || /[\\/]|^\.+$|\.{2}/.test(clean)) return false
                const fullPath = `${dirPath}\\${clean}`
                const res = await window.api.createFile(workspaceRoot || currentProject.path, fullPath)
                if (res.success) {
                  openFileInTab({ path: fullPath, name: clean, content: '', language: getLang(clean) })
                  await after?.()
                }
                return res.success
              })}
              onRequestNewFolder={(dirPath, after) => requestName('New folder name', '', async (value) => {
                const clean = value.trim()
                if (!clean || /[\\/]|^\.+$|\.{2}/.test(clean)) return false
                const fullPath = `${dirPath}\\${clean}`
                const res = await window.api.createFolder(workspaceRoot || currentProject.path, fullPath)
                if (res.success) await after?.()
                return res.success
              })}
              onRequestRename={(targetPath, currentName, after) => requestName(`Rename "${currentName}" to:`, currentName, async (value) => {
                const clean = value.trim()
                if (!clean || clean === currentName || /[\\/]|^\.+$|\.{2}/.test(clean)) return false
                const res = await window.api.renameFile(workspaceRoot || currentProject.path, targetPath, clean)
                if (res.success) {
                  const newPath = res.path || `${targetPath.substring(0, Math.max(targetPath.lastIndexOf('\\'), targetPath.lastIndexOf('/')))}\\${clean}`
                  const newLang = getLang(clean)
                  setOpenFiles(prev => prev.map(f => f.path === targetPath ? { ...f, path: newPath, name: clean, language: newLang } : f))
                  if (currentFile === targetPath) {
                    setCurrentFile(newPath)
                    setCurrentLanguage(newLang)
                  }
                  await after?.()
                }
                return res.success
              })}
              onRequestDelete={(targetPath, currentName, after) => requestConfirm(`Delete "${currentName}"?`, async () => {
                const res = await window.api.deleteFile(workspaceRoot || currentProject.path, targetPath)
                if (res.success) await after?.()
                return res.success
              })}
            />
          ))
        )}
      </div>
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
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
      <div style={{ width: 360, background: '#13131e', border: '1px solid #2a2a3d', borderRadius: 12, padding: 14 }}>
        <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{title}</div>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSubmit?.(value) }}
          style={{ width: '100%', padding: '8px 10px', background: '#080810', border: '1px solid #2a2a3d', color: '#e8e8f0', borderRadius: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <button onClick={onCancel} style={{ background: 'none', border: '1px solid #2a2a3d', color: '#aaaacc', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSubmit?.(value)} style={{ background: '#7c6df5', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>OK</button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
      <div style={{ width: 340, background: '#13131e', border: '1px solid #2a2a3d', borderRadius: 12, padding: 14 }}>
        <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <button onClick={onCancel} style={{ background: 'none', border: '1px solid #2a2a3d', color: '#aaaacc', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ background: '#ff4d6d', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}
