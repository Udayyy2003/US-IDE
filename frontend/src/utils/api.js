import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } })

// ─── Auth ───────────────────────────────────
export const loginWithGoogle = () => Promise.reject(new Error('Auth removed'))

// ─── Projects ───────────────────────────────
export const getProjects = () => Promise.resolve({ data: { projects: [] } })

export const createProject = () => Promise.reject(new Error('Projects API removed'))

export const getProjectFiles = () => Promise.resolve({ data: { files: [] } })

// ─── Files ──────────────────────────────────
export const createFile = (root_path, path) => api.post('/api/create-file', { root_path, path })

export const createFolder = (root_path, path) => api.post('/api/create-folder', { root_path, path })

export const saveFile = (path, content) => api.post('/api/save-file', { path, content })

export const loadFile = (path) => api.post('/api/read-file', { path })

export const deleteFile = (path) => api.post('/api/delete-file', { path })

export const renameFile = (path, new_name) => api.post('/api/rename-file', { path, new_name })

// ─── Code Execution ─────────────────────────
export const runCode = () => Promise.reject(new Error('Execution API removed'))

// ─── AI Chat ────────────────────────────────
export const aiChat = (data) => api.post('/api/ai-chat', data)

// ─── Health ─────────────────────────────────
export const healthCheck = () => api.get('/api/health')

export default api
