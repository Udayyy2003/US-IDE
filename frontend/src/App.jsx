import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { IDEProvider } from './contexts/IDEContext'
import IDEPage from './pages/IDEPage'
import WelcomeScreen from './pages/WelcomeScreen'

export default function App() {
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false)

  return (
    <IDEProvider>
      <Routes>
        <Route
          path="/"
          element={
            workspaceLoaded
              ? <IDEPage />
              : <WelcomeScreen onWorkspaceOpened={() => setWorkspaceLoaded(true)} />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </IDEProvider>
  )
}
