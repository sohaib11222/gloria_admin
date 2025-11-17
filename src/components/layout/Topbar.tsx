import React, { useState } from 'react'
import { useAtom } from 'jotai'
import { LogOut, Bell, Search } from 'lucide-react'
import { userAtom, logoutAtom } from '../../store/auth'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { NotificationsDrawer } from '../NotificationsDrawer'
import { useSearch } from '../../contexts/SearchContext'

export const Topbar: React.FC = () => {
  const [user] = useAtom(userAtom)
  const [, logout] = useAtom(logoutAtom)
  const [showNotifications, setShowNotifications] = useState(false)
  const { openSearch } = useSearch()

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <Badge variant="info" size="sm" className="font-mono text-xs">
            {import.meta.env.VITE_MIDDLEWARE_URL || 'http://localhost:8080'}
          </Badge>
          <button
            onClick={openSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Quick search...</span>
            <kbd className="hidden md:inline px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-white rounded border border-gray-300">Ctrl K</kbd>
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pr-4 border-r border-gray-200">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-semibold text-white shadow-md">
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
            className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            {/* Unread badge - this would come from actual notifications */}
            <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
          </button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2 hover:bg-red-50 hover:text-red-600"
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
