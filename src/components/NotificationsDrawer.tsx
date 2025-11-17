import React, { useState, useEffect } from 'react'
import { X, Bell, Check } from 'lucide-react'
import http from '../lib/http'
import { cn } from '../lib/utils'
import { formatDate } from '../lib/utils'

interface Notification {
  id: string
  type: 'agreement' | 'health' | 'company' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

export const NotificationsDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      // Try backend first
      const { data } = await http.get('/admin/notifications')
      setNotifications(data.items || [])
    } catch (error) {
      // Fallback to mock data
      setNotifications([
        {
          id: '1',
          type: 'agreement',
          title: 'New agreement awaiting approval',
          message: 'Agent: Acme Travel, Source: CarCo',
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: '/agreements-management',
        },
        {
          id: '2',
          type: 'health',
          title: 'Source moved to backoff',
          message: 'SlowRate source excluded for 15 minutes',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          read: false,
          actionUrl: '/health',
        },
        {
          id: '3',
          type: 'company',
          title: 'New company registered',
          message: 'Type: SOURCE, Status: ACTIVE',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: true,
          actionUrl: '/companies',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'agreement':
        return '📋'
      case 'health':
        return '⚠️'
      case 'company':
        return '🏢'
      case 'system':
        return '⚙️'
      default:
        return '🔔'
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 rounded-lg p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="mt-2 text-xs text-blue-100 hover:text-white flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No notifications</p>
              <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id)
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl
                      onClose()
                    }
                  }}
                  className={cn(
                    'w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors',
                    !notification.read && 'bg-blue-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">{formatDate(notification.timestamp)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

