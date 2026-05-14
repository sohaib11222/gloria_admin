import { useEffect, useState } from 'react'

function accessTokenIsAdminFromString(token: string | null): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length < 2) return false
  try {
    const payload = JSON.parse(atob(parts[1])) as { role?: string }
    return payload.role === 'ADMIN'
  } catch {
    return false
  }
}

export function accessTokenIsAdmin(): boolean {
  return accessTokenIsAdminFromString(localStorage.getItem('token'))
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token && user && !accessTokenIsAdminFromString(token)) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
        return
      }
      const authenticated = !!(token && user && accessTokenIsAdminFromString(token))
      setIsAuthenticated(authenticated)
    }

    checkAuth()

    // Listen for storage changes (e.g., when user logs out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return isAuthenticated
}
