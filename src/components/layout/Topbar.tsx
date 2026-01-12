import React, { useState } from 'react'
import { useAtom } from 'jotai'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LogOut, Bell, Search } from 'lucide-react'
import { userAtom, logoutAtom } from '../../store/auth'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { NotificationsDrawer } from '../NotificationsDrawer'
import { useSearch } from '../../contexts/SearchContext'
import http from '../../lib/http'

export const Topbar: React.FC = () => {
  const navigate = useNavigate()
  const [user] = useAtom(userAtom)
  const [, logout] = useAtom(logoutAtom)
  const [showNotifications, setShowNotifications] = useState(false)
  const { openSearch } = useSearch()
  
  // Fetch unread notification count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      try {
        const { data } = await http.get('/admin/notifications', {
          params: { limit: 50, unreadOnly: true }
        })
        const items = data?.items || data?.data?.items || []
        return items.filter((n: any) => !n.read && !n.readAt)
      } catch (error) {
        return []
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1,
  })
  
  const unreadCount = notificationsData?.length || 0

  const handleLogout = () => {
    // Clear all authentication data
    logout()
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('notifiedAgreements')
    
    // Navigate to login page
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Badge variant="info" size="sm" className="font-mono text-xs">
            {(() => {
              if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL
              if (import.meta.env.PROD) return 'Same Origin (Production)'
              return 'http://localhost:8080'
            })()}
          </Badge>
          <button
            onClick={openSearch}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors duration-150"
          >
            <Search className="h-4 w-4 text-gray-500" />
            <span className="hidden md:inline text-gray-600">Quick search...</span>
            <kbd className="hidden md:inline px-2 py-0.5 text-xs font-semibold text-gray-500 bg-white rounded border border-gray-300">Ctrl K</kbd>
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pr-4 border-r border-gray-200">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-sm font-semibold text-white">
              {(user?.email || 'U').substring(0, 1).toUpperCase()}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {user?.email}
              </span>
              <Badge variant="default" size="sm" className="ml-1">
                {user?.type}
              </Badge>
            </div>
          </div>

          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-150"
          >
            <Bell className="h-5 w-5" />
            {/* Unread badge - show only if there are unread notifications */}
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-600 text-white text-xs font-semibold rounded flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      <NotificationsDrawer isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  )
}
