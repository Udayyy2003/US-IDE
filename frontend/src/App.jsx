import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { IDEProvider } from './contexts/IDEContext'
import LoginPage from './pages/LoginPage'
import IDEPage from './pages/IDEPage'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="text-center">
          <div className="spinner mx-auto mb-3" style={{ width: 32, height: 32 }} />
          <p className="text-text-secondary text-sm font-mono">Loading US-IDE...</p>
        </div>
      </div>
    )
  }
  return user ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <IDEProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/ide"
            element={
              <RequireAuth>
                <IDEPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </IDEProvider>
    </AuthProvider>
  )
}
