import React, { createContext, useContext, useState, useEffect } from 'react'
import { loginWithGoogle } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Load user from localStorage on app load
  useEffect(() => {
    const savedUser = localStorage.getItem("uside_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsLoggedIn(true);
      } catch (e) {
        localStorage.removeItem("uside_user");
      }
    }
    setLoading(false);
  }, [])

  // Handle login response
  const handleGoogleLogin = (userData) => {
    if (userData) {
      setUser(userData);
      setIsLoggedIn(true);
      localStorage.setItem("uside_user", JSON.stringify(userData));
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem("uside_user");
    setUser(null);
    setIsLoggedIn(false);
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, handleGoogleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
