import axios from 'axios'
import { API_BASE_URL } from './apiConfig'

// Get API base URL - recalculate it to ensure it's current
function getCurrentApiBaseUrl(): string {
  // If explicitly set in env, use that (but fix protocol if needed)
  if (import.meta.env.VITE_API_BASE_URL) {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    // If env URL is HTTP but page is HTTPS, convert to HTTPS to avoid mixed content
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && envUrl.startsWith('http://')) {
      console.warn('⚠️ Converting HTTP API URL to HTTPS to avoid mixed content:', envUrl)
      return envUrl.replace('http://', 'https://')
    }
    return envUrl
  }

  // Auto-detect protocol based on current page protocol
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:'
  
  // Check if we're on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isLocalhost && !import.meta.env.PROD) {
      return 'http://localhost:8080'
    }
  }
  
  // Production: use production API with protocol matching
  return `${protocol}//api.gloriaconnect.com/api`
}

const BASE_URL = getCurrentApiBaseUrl()

// Log the API base URL for debugging
console.log('🔧 API Base URL configured:', BASE_URL)
console.log('🔧 Current page protocol:', typeof window !== 'undefined' ? window.location.protocol : 'N/A')
console.log('🔧 Current page hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A')

export const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Ensure response is parsed as JSON
  responseType: 'json',
  // CRITICAL: Match backend CORS configuration (credentials: false)
  withCredentials: false,
  // Don't validate status - let axios handle all responses
  validateStatus: () => true, // Accept all status codes, handle errors in interceptor
})

http.interceptors.request.use(
  (config) => {
    // CRITICAL: Recalculate baseURL dynamically to ensure protocol matches page protocol
    // This fixes mixed content issues (HTTPS page calling HTTP API)
    if (typeof window !== 'undefined') {
      const currentProtocol = window.location.protocol
      const currentBaseURL = config.baseURL || BASE_URL
      
      // If page is HTTPS but API URL is HTTP, convert to HTTPS
      if (currentProtocol === 'https:' && currentBaseURL && currentBaseURL.startsWith('http://')) {
        const correctedBaseURL = currentBaseURL.replace('http://', 'https://')
        console.warn('⚠️ Fixing protocol mismatch (Admin):', {
          original: currentBaseURL,
          corrected: correctedBaseURL,
          pageProtocol: currentProtocol,
          pageURL: window.location.href
        })
        config.baseURL = correctedBaseURL
      }
    }
    
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Ensure CORS settings are explicit
    config.withCredentials = false
    
    // Log request details for auth endpoints
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
      const fullURL = config.baseURL && config.url 
        ? `${config.baseURL}${config.url.startsWith('/') ? '' : '/'}${config.url}`
        : 'N/A'
      console.log('📤 Request interceptor (Admin):', {
        url: config.url,
        baseURL: config.baseURL,
        fullURL: fullURL,
        method: config.method,
        hasToken: !!token,
        pageProtocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
        pageURL: typeof window !== 'undefined' ? window.location.href : 'N/A',
        headers: Object.keys(config.headers || {}),
        withCredentials: config.withCredentials
      })
    }
    
    // If data is FormData, don't set Content-Type - axios will set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

http.interceptors.response.use(
  (response) => {
    // Check if response is successful (200-299)
    if (response.status >= 200 && response.status < 300) {
      // Log successful responses for debugging
      if (response.config.url?.includes('/auth/login') || response.config.url?.includes('/auth/register')) {
        console.log('✅ Auth response interceptor (Admin):', {
          url: response.config.url,
          status: response.status,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : []
        })
      }
      
      // Ensure response.data exists
      if (!response.data) {
        console.warn('⚠️ Response data is empty, but status is OK')
        response.data = {}
      }
      
      return response
    }
    
    // For non-2xx status codes, treat as error
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as any
    error.response = response
    error.status = response.status
    error.statusText = response.statusText
    return Promise.reject(error)
  },
  (error) => {
    // If we have a response, extract error data properly
    if (error.response) {
      // Response was received but status is not 2xx
      const status = error.response.status
      let errorData = error.response.data || {}
      
      // If errorData is a string, try to parse it as JSON
      if (typeof errorData === 'string') {
        try {
          errorData = JSON.parse(errorData)
        } catch (e) {
          errorData = { message: errorData }
        }
      }
      
      // Ensure error.response.data is properly structured
      error.response.data = errorData
      
      // Extract backend error message if available
      if (errorData.message && !error.message.includes(errorData.message)) {
        error.message = errorData.message || error.message
      }
      
      // Log for debugging
      if (error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')) {
        console.error('🔴 Auth error response (Admin):', {
          url: error.config?.url,
          status: status,
          error: errorData.error,
          message: errorData.message || error.message
        })
      }
      
      return Promise.reject(error)
    }
    
    // Network error (no response received)
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.error('🔴 Network error (Admin):', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      })
      
      const networkError = new Error('Network error. Please check your internet connection and ensure the server is running.') as any
      networkError.isNetworkError = true
      networkError.code = error.code || 'ERR_NETWORK'
      networkError.status = 0
      return Promise.reject(networkError)
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


