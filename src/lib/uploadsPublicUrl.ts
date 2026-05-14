import { API_BASE_URL } from './apiConfig'

function getApiBaseForClient(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    let u = import.meta.env.VITE_API_BASE_URL as string
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && u.startsWith('http://')) {
      u = u.replace('http://', 'https://')
    }
    return u
  }
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isLocalhost && !import.meta.env.PROD) {
      return 'http://localhost:8080'
    }
  }
  return API_BASE_URL
}

/**
 * Backend serves files under `/uploads` and `/api/uploads`.
 * Stored paths should be like `/api/uploads/registration-photos/...`.
 */
export function uploadsPublicUrl(storedPath: string | null | undefined): string | null {
  if (!storedPath?.trim()) return null
  const p = storedPath.trim()
  if (p.startsWith('http://') || p.startsWith('https://')) return p

  const base = getApiBaseForClient()
  if (base.startsWith('http://') || base.startsWith('https://')) {
    const origin = base.replace(/\/api\/?$/, '')
    return `${origin.replace(/\/$/, '')}${p.startsWith('/') ? p : `/${p}`}`
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}${p.startsWith('/') ? p : `/${p}`}`
}
