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
  // If explicitly set, use that
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // In production, use relative path (works with reverse proxy like nginx)
  // The backend should be accessible at the same origin
  if (import.meta.env.PROD) {
    // Return empty string for relative paths, or '/api' if your backend is at /api
    return ''
  }

  // Development: use localhost
  return 'http://localhost:8080'
}

export const API_BASE_URL = getApiBaseUrl()

