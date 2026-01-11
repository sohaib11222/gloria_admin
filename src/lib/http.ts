import axios from 'axios'
import { API_BASE_URL } from './apiConfig'

const BASE_URL = API_BASE_URL

export const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined') {
        // Get base path (matches vite.config.js and main.jsx)
        const basePath = import.meta.env.PROD ? '/admin' : ''
        const loginPath = `${basePath}/login`
        const currentPath = window.location.pathname
        
        // Only redirect if not already on login page
        if (!currentPath.endsWith('/login') && !currentPath.endsWith('/login/')) {
          window.location.href = loginPath
        }
      }
    }
    
    // Log errors for debugging (but don't show technical details to users)
    if (error?.response?.status >= 500) {
      const errorData = error?.response?.data || {}
      const errorCode = errorData.error
      
      // Don't log sensitive database errors to console in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Server error:', {
          status: error?.response?.status,
          code: errorCode,
          message: errorData.message
        })
      }
    }
    
    return Promise.reject(error)
  }
)

export default http


