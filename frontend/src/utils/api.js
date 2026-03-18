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
export const createFile = () => Promise.reject(new Error('File API removed'))

export const saveFile = () => Promise.reject(new Error('File API removed'))

export const loadFile = () => Promise.reject(new Error('File API removed'))

// ─── Code Execution ─────────────────────────
export const runCode = () => Promise.reject(new Error('Execution API removed'))

// ─── AI Chat ────────────────────────────────
export const aiChat = (data) => api.post('/api/ai-chat', data)

// ─── Health ─────────────────────────────────
export const healthCheck = () => api.get('/api/health')

export default api
