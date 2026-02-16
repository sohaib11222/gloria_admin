import axios from 'axios'
import toast from 'react-hot-toast'
import { API_BASE_URL } from './apiConfig'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - clear auth and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('refreshToken')
      // Use app base path so we go to /admin/login when served at /admin/
      const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || ''
      const loginPath = basePath ? `${basePath}/login` : '/login'
      const currentPath = window.location.pathname
      if (!currentPath.endsWith('/login') && !currentPath.endsWith('/login/')) {
        window.location.href = loginPath
      }
      return Promise.reject(error)
    }
    
    // Extract error message with better handling
    let message = 'An error occurred'
    
    if (error.response) {
      // Server responded with error
      const errorData = error.response.data
      
      if (errorData?.message) {
        message = errorData.message
      } else if (errorData?.error) {
        message = errorData.error
      } else if (typeof errorData === 'string') {
        message = errorData
      } else if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Handle validation errors
        const errorMessages = errorData.errors
          .map((err: any) => err.message || err.error || JSON.stringify(err))
          .join(', ')
        message = errorMessages || `Validation failed: ${error.response.statusText}`
      } else {
        message = error.response.statusText || `Server error (${error.response.status})`
      }
    } else if (error.request) {
      // Request made but no response received
      message = 'Network error: Unable to connect to server. Please check your connection.'
    } else {
      // Error in request setup
      message = error.message || 'An unexpected error occurred'
    }
    
    // Only show toast for non-401 errors (401 redirects, so no toast needed)
    if (error.response?.status !== 401) {
      toast.error(message, {
        duration: error.response?.status === 500 ? 6000 : 4000,
      })
    }
    
    return Promise.reject(error)
  }
)

export default api
