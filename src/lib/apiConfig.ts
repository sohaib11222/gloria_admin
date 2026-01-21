/**
 * API Base URL Configuration
 * 
 * Priority:
 * 1. VITE_API_BASE_URL environment variable (if set)
 * 2. Empty string for production (relative paths) - works with reverse proxy
 * 3. http://localhost:8080 for development
 * 
 * This allows:
 * - Local dev: Uses http://localhost:8080
 * - Production: Uses relative paths (/api or empty string) when deployed behind reverse proxy
 * - Override: Can set VITE_API_BASE_URL in .env file
 */

export function getApiBaseUrl(): string {
  // If explicitly set, use that (but still check for protocol mismatch)
  if (import.meta.env.VITE_API_BASE_URL) {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    // If env URL is HTTP but page is HTTPS, convert to HTTPS to avoid mixed content
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && envUrl.startsWith('http://')) {
      return envUrl.replace('http://', 'https://')
    }
    return envUrl
  }

  // Auto-detect protocol based on current page protocol to avoid mixed content issues
  // If page is HTTPS, use HTTPS for API; if HTTP, use HTTP
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:'
  
  // Always use production API URL with auto-detected protocol
  // This prevents mixed content blocking (HTTPS page calling HTTP API)
  // In development, you can still use localhost by setting VITE_API_BASE_URL
  if (typeof window !== 'undefined') {
    // Check if we're on localhost - if so, use localhost API
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isLocalhost && !import.meta.env.PROD) {
      return 'http://localhost:8080'
    }
  }
  
  // Production or remote: use production API with protocol matching
  return `${protocol}//api.gloriaconnect.com/api`
}

export const API_BASE_URL = getApiBaseUrl()

