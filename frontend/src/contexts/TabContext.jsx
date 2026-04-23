import React, { createContext, useContext, useState, useCallback } from 'react';

const TabContext = createContext(null);

export function TabProvider({ children }) {
  const [tabs, setTabs] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState(-1);

  const openTab = useCallback((tab) => {
    setTabs(prev => {
      const exists = prev.findIndex(t => t.path === tab.path);
      if (exists !== -1) {
        setActiveTabIndex(exists);
        return prev;
      }
      
      // Store in recent files (localStorage)
      const stored = localStorage.getItem('recentFiles');
      let recent = [];
      if (stored) {
        try {
          recent = JSON.parse(stored);
        } catch (e) {}
      }
      const filtered = recent.filter(f => f.path !== tab.path);
      const updated = [{ name: tab.name, path: tab.path }, ...filtered].slice(0, 10);
      localStorage.setItem('recentFiles', JSON.stringify(updated));

      const newTabs = [...prev, { ...tab, unsaved: false, lastSavedContent: tab.content }];
      setActiveTabIndex(newTabs.length - 1); // Set active index immediately
      return newTabs;
    });
  }, []);

  const closeTab = useCallback((index) => {
    setTabs(prev => {
      const updated = prev.filter((_, i) => i !== index);
      
      if (index === activeTabIndex) {
        if (updated.length > 0) {
          setActiveTabIndex(Math.max(0, index - 1));
        } else {
          setActiveTabIndex(-1);
        }
      } else if (index < activeTabIndex) {
        setActiveTabIndex(prevIdx => prevIdx - 1);
      }
      
      return updated;
    });
  }, [activeTabIndex]);

  const closeAllTabs = useCallback(() => {
    setTabs([]);
    setActiveTabIndex(-1);
  }, []);

  return (
    <TabContext.Provider value={{
      tabs, setTabs,
      activeTabIndex, setActiveTabIndex,
      openTab, openFile: openTab, closeTab, closeAllTabs
    }}>
      {children}
    </TabContext.Provider>
  );
}

export const useTabs = () => useContext(TabContext);
