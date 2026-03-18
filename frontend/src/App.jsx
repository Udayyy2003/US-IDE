import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { IDEProvider } from './contexts/IDEContext'
import IDEPage from './pages/IDEPage'
import WelcomeScreen from './pages/WelcomeScreen'
import BrowserFallback from './components/BrowserFallback'

export default function App() {
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false)
  const isElectron = !!window.api

  return (
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </IDEProvider>
  )
}
