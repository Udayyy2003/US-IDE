import axios from 'axios'

// Base URL from environment variable
const BASE_URL = import.meta.env.VITE_API_URL || ''

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('us_ide_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('us_ide_token')
      localStorage.removeItem('us_ide_user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ───────────────────────────────────
export const loginWithGoogle = (googleToken) =>
  api.post('/api/login/google', { token: googleToken })

// ─── Projects ───────────────────────────────
export const getProjects = () => api.get('/api/projects')

export const createProject = (data) => api.post('/api/create-project', data)

export const getProjectFiles = (projectName) =>
  api.post('/api/project-files', { projectName })

// ─── Files ──────────────────────────────────
export const createFile = (data) => api.post('/api/create-file', data)

export const saveFile = (data) => api.post('/api/save-file', data)

export const loadFile = (projectName, fileName) =>
  api.post('/api/load-file', { projectName, fileName })

// ─── Code Execution ─────────────────────────
export const runCode = (data) => api.post('/api/run-code', data)

// ─── AI Chat ────────────────────────────────
export const aiChat = (data) => api.post('/api/ai-chat', data)

// ─── Health ─────────────────────────────────
export const healthCheck = () => api.get('/api/health')

export default api
