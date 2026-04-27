import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useTabs } from './TabContext';
import { useFiles } from './FileContext';
import * as api from '../utils/api';

const EditorContext = createContext(null);

export function EditorProvider({ children }) {
  const { tabs, setTabs, activeTabIndex, setActiveTabIndex } = useTabs();
  const { workspaceRoot } = useFiles();
  const [autoSave, setAutoSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimer = useRef(null);

  const markSaved = useCallback((tabIndex) => {
    setTabs(prev => prev.map((t, i) =>
      i === tabIndex ? { ...t, unsaved: false, lastSavedContent: t.content } : t
    ));
  }, [setTabs]);

  const updateTabContent = useCallback((tabIndex, content) => {
    setTabs(prev => prev.map((t, i) => {
      if (i !== tabIndex) return t;
      // If content matches last saved, it's not dirty
      const isDirty = t.lastSavedContent !== undefined ? t.lastSavedContent !== content : true;
      return { ...t, content, unsaved: isDirty };
    }));
  }, [setTabs]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const tab = tabs[activeTabIndex];
      if (tab && tab.unsaved) {
        setIsSaving(true);
        try {
          if (window.api) {
            await window.api.saveFile(workspaceRoot, tab.path, tab.content);
          } else {
            await api.saveFile(tab.path, tab.content);
          }
          markSaved(activeTabIndex);
        } catch (e) {
          console.error("Auto-save error:", e);
        } finally {
          setIsSaving(false);
        }
      }
    }, 2000);
  }, [activeTabIndex, tabs, workspaceRoot, markSaved]);

  const handleEditorChange = useCallback((value) => {
    if (activeTabIndex === -1) return;
    const content = value || '';
    updateTabContent(activeTabIndex, content);
    if (autoSave) triggerAutoSave();
  }, [activeTabIndex, autoSave, updateTabContent, triggerAutoSave]);

  const replaceContent = useCallback((content) => {
    if (activeTabIndex === -1) return;
    updateTabContent(activeTabIndex, content);
    if (autoSave) triggerAutoSave();
  }, [activeTabIndex, autoSave, updateTabContent, triggerAutoSave]);

  const insertAtCursor = useCallback((content) => {
    if (activeTabIndex === -1) return;
    const currentContent = tabs[activeTabIndex]?.content || '';
    const newContent = currentContent + "\n" + content;
    updateTabContent(activeTabIndex, newContent);
    if (autoSave) triggerAutoSave();
  }, [activeTabIndex, tabs, autoSave, updateTabContent, triggerAutoSave]);

  return (
    <EditorContext.Provider value={{
      autoSave, setAutoSave,
      isSaving, setIsSaving,
      handleEditorChange,
      updateTabContent,
      markSaved,
      replaceContent,
      insertAtCursor,
      currentFile: tabs[activeTabIndex]?.path || null,
      currentLanguage: tabs[activeTabIndex]?.language || 'plaintext',
      editorContent: tabs[activeTabIndex]?.content || ''
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export const useEditor = () => useContext(EditorContext);
