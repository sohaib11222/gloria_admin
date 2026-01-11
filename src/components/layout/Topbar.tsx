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
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
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
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md group"
          >
            <Search className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
            <span className="hidden md:inline text-gray-600 group-hover:text-blue-700 transition-colors">Quick search...</span>
            <kbd className="hidden md:inline px-2 py-0.5 text-xs font-semibold text-gray-500 bg-white rounded border border-gray-300 group-hover:border-blue-300 group-hover:text-blue-600 transition-colors">Ctrl K</kbd>
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pr-4 border-r border-gray-200">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-blue-200 hover:ring-blue-300 transition-all duration-200 hover:scale-105">
              {(user?.email || 'U').substring(0, 1).toUpperCase()}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-900">
                {user?.email}
              </span>
              <Badge variant="default" size="sm" className="ml-1">
                {user?.type}
              </Badge>
            </div>
          </div>

          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2.5 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-lg transition-all duration-200 hover:shadow-md group"
          >
            <Bell className="h-5 w-5 group-hover:text-blue-600 transition-colors" />
            {/* Unread badge - show only if there are unread notifications */}
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-5 w-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-600 transition-all duration-200 hover:shadow-sm"
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
