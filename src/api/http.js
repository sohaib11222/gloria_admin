// Get API base URL with the same logic as TypeScript version
function getApiBaseUrl() {
  // If explicitly set, use that
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // In production, use relative path (works with reverse proxy)
  if (import.meta.env.PROD) {
    return ''
  }
  
  // Development: use localhost
  return 'http://localhost:8080'
}

const DEFAULT_BASE_URL = getApiBaseUrl()

export class HttpClient {
  constructor(baseURL = DEFAULT_BASE_URL) {
    this.baseURL = baseURL
  }

  setBaseURL(url) {
    this.baseURL = url
  }

  async request(endpoint, options = {}) {
    const { baseURL, ...fetchOptions } = options
    const url = `${baseURL || this.baseURL}${endpoint}`
    
    // Add authentication token if available
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    try {
      const response = await fetch(url, {
        headers,
        ...fetchOptions,
      })

      if (!response.ok) {
        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
        error.status = response.status
        error.statusText = response.statusText
        throw error
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return await response.text()
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error
      }
      
      const httpError = new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      httpError.status = 0
      httpError.statusText = 'Network Error'
      throw httpError
    }
  }

  async get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  async post(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }
}

export const httpClient = new HttpClient()
