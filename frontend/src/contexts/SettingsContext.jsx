import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const DEFAULT_SETTINGS = {
  theme: "dark",
  layout: "default", // "default", "minimal", "focus", "ai-first"
  aiAutoCreate: true,
  aiAutoWrite: "ask", // "on", "ask"
  structureMode: "structured", // "simple", "structured"
  aiVerbosity: "short", // "short", "detailed"
  fontSize: 14,
  fontFamily: "JetBrains Mono",
  lineNumbers: true,
  wordWrap: false,
  accentColor: "#7c6df5"
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("uside_settings");
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [isCustomizePanelOpen, setIsCustomizePanelOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("uside_settings", JSON.stringify(settings));
    // Apply theme to body
    document.body.setAttribute("data-theme", settings.theme);
    // Apply accent color as CSS variable
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      resetSettings, 
      isCustomizePanelOpen, 
      setIsCustomizePanelOpen 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
