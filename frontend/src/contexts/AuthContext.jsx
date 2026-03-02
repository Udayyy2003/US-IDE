import React, { createContext, useContext, useState, useEffect } from 'react'
import { loginWithGoogle } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('us_ide_user')
    const token = localStorage.getItem('us_ide_token')
    if (stored && token) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  const handleGoogleLogin = async (credential) => {
    const res = await loginWithGoogle(credential)
    const { token, user: userData } = res.data
    localStorage.setItem('us_ide_token', token)
    localStorage.setItem('us_ide_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('us_ide_token')
    localStorage.removeItem('us_ide_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, handleGoogleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
