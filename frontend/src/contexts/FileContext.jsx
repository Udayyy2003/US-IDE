import React, { createContext, useContext, useState, useCallback } from 'react';
import * as api from '../utils/api';

const FileContext = createContext(null);

export function FileProvider({ children }) {
  const [workspaceRoot, setWorkspaceRoot] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const loadFiles = useCallback(async () => {
    const dir = currentProject?.path;
    if (!dir) return;
    setLoading(true);
    try {
      let files = [];
      if (window.api) {
        const res = await window.api.readDir(dir);
        if (res.success) {
          files = res.files;
        } else {
          console.error("[FileContext] Electron readDir failed:", res.error);
        }
      } else {
        const flaskRes = await fetch('http://localhost:5000/api/file-tree', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ root_path: dir })
        });
        files = await flaskRes.json();
      }
      
      console.log("FILE TREE LOADED:", files);
      setFileTree(files);
      setRefreshToken(t => t + 1);
    } catch (e) {
      console.error("[FileContext] Error loading tree:", e);
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  const openProject = useCallback((project) => {
    setCurrentProject(project);
    setWorkspaceRoot(project?.path || null);
    setFileTree([]);
  }, []);

  const createFile = useCallback(async (fileName, content = "", parentPath = "") => {
    try {
      const fullPath = parentPath ? `${parentPath}\\${fileName}` : fileName;
      const root = workspaceRoot || currentProject?.path;
      
      let res;
      if (window.api) {
        res = await window.api.createFile(root, fullPath, content);
      } else {
        const apiRes = await api.createFile(root, fullPath, content);
        res = apiRes.data;
      }
      
      if (res.success) {
        await loadFiles();
      }
      return res;
    } catch (err) {
      console.error("Create file error:", err);
      return { success: false, error: err.message };
    }
  }, [workspaceRoot, currentProject, loadFiles]);

  const createFolder = useCallback(async (folderName, parentPath = "") => {
    try {
      const fullPath = parentPath ? `${parentPath}\\${folderName}` : folderName;
      const root = workspaceRoot || currentProject?.path;

      let res;
      if (window.api) {
        res = await window.api.createFolder(root, fullPath);
      } else {
        const apiRes = await api.createFolder(root, fullPath);
        res = apiRes.data;
      }

      if (res.success) {
        await loadFiles();
      }
      return res;
    } catch (err) {
      console.error("Create folder error:", err);
      return { success: false, error: err.message };
    }
  }, [workspaceRoot, currentProject, loadFiles]);

  return (
    <FileContext.Provider value={{
      workspaceRoot, setWorkspaceRoot,
      currentProject, setCurrentProject,
      fileTree, setFileTree,
      selectedFile, setSelectedFile,
      loading, setLoading,
      refreshToken, setRefreshToken,
      loadFiles,
      openProject,
      createFile,
      createFolder
    }}>
      {children}
    </FileContext.Provider>
  );
}

export const useFiles = () => useContext(FileContext);
