import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { IDEProvider } from './contexts/IDEContext'
import { FileProvider } from './contexts/FileContext'
import { TabProvider } from './contexts/TabContext'
import { EditorProvider } from './contexts/EditorContext'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import IDEPage from './pages/IDEPage'
import WelcomeScreen from './pages/WelcomeScreen'
import USLogin from './pages/USLogin'
import BrowserFallback from './components/BrowserFallback'

export default function App() {
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false)
  
  // More robust check for Electron environment
  const isElectron = typeof window !== 'undefined' && (!!window.api || !!window.electron);

  if (isElectron && !window.api && window.electron) {
    window.api = window.electron; // Compatibility fallback if user changed the name
  }

  return (
    <SettingsProvider>
      <AuthProvider>
        <FileProvider>
          <TabProvider>
            <EditorProvider>
              <IDEProvider>
                <Routes>
                  <Route
                    path="/"
                    element={
                      isElectron ? (
                        workspaceLoaded ? (
                          <IDEPage />
                        ) : (
                          <WelcomeScreen onWorkspaceOpened={() => setWorkspaceLoaded(true)} />
                        )
                      ) : (
                        <BrowserFallback />
                      )
                    }
                  />
                  <Route path="/us-login" element={<USLogin />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </IDEProvider>
            </EditorProvider>
          </TabProvider>
        </FileProvider>
      </AuthProvider>
    </SettingsProvider>
  )
}
