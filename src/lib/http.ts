import axios from 'axios'
import { API_BASE_URL } from './apiConfig'

const BASE_URL = API_BASE_URL

export const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Ensure response is parsed as JSON
  responseType: 'json',
  // Explicitly set CORS credentials to match backend (credentials: false)
  withCredentials: false,
  // Handle response transformation
  transformResponse: [(data) => {
    // If data is empty string, return empty object
    if (data === '' || data === null || data === undefined) {
      console.warn('⚠️ Empty response body received')
      return {}
    }
    
    // If data is a string, try to parse it
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch (e) {
        console.warn('Failed to parse response as JSON:', data)
        return data
      }
    }
    return data
  }],
  // Ensure we validate status - don't throw on 200-299
  validateStatus: (status) => {
    return status >= 200 && status < 300
  },
})

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Ensure CORS settings are explicit
    config.withCredentials = false
    
    // If data is FormData, don't set Content-Type - axios will set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

http.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    if (response.config.url?.includes('/auth/login') || response.config.url?.includes('/auth/register')) {
      console.log('✅ Auth response interceptor (Admin):', {
        url: response.config.url,
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      })
      
      // Ensure response.data exists even if empty
      if (!response.data) {
        console.error('❌ Response data is empty!')
        response.data = {}
      }
    }
    return response
  },
  (error) => {
    // Check for CORS errors specifically - only if we have a network error AND no response
    // CORS errors typically show up as network errors with no response object
    if (error.code === 'ERR_NETWORK' && !error.response) {
      // Check if it's actually a CORS error by checking the error message
      const isCorsError = error.message?.includes('CORS') || 
                         error.message?.includes('cross-origin') ||
                         error.message?.includes('Access-Control')
      
      if (isCorsError) {
        console.error('🚫 CORS Error detected (Admin):', {
          message: error.message,
          code: error.code,
          config: error.config
        })
        
        // Create a CORS-specific error
        const corsError = new Error('CORS error: Unable to connect to server. Please check your network connection and ensure the server CORS configuration is correct.')
        ;(corsError as any).isNetworkError = true
        ;(corsError as any).isCorsError = true
        ;(corsError as any).code = 'CORS_ERROR'
        return Promise.reject(corsError)
      }
    }
    
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


