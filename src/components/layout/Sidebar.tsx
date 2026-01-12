import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { NAVIGATION_ITEMS } from '../../lib/constants'
import * as Icons from 'lucide-react'
import { Menu, X } from 'lucide-react'

interface SidebarProps {
  mobileOpen?: boolean
  onMobileToggle?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onMobileToggle }) => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50',
          'w-64 bg-white border-r border-gray-200',
          'transform transition-transform duration-200 ease-in-out',
          'flex flex-col h-screen lg:h-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center px-6 py-4 border-b border-gray-200 bg-gray-900">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">Gloria Connect</h1>
              <p className="text-xs text-gray-400 font-medium">Platform</p>
            </div>
          </div>
          {onMobileToggle && (
            <button
              onClick={onMobileToggle}
              className="lg:hidden ml-auto p-2 text-gray-400 hover:bg-gray-800 rounded transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = Icons[item.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
            
          // Open docs in new tab
          if (item.path === '/docs') {
            const handleDocsClick = (e: React.MouseEvent) => {
              e.preventDefault()
              onMobileToggle?.()
              // Construct the full URL for docs-fullscreen
              // Base path is always /admin to match vite.config.js and React Router basename
              const basePath = '/admin'
              const docsPath = `${basePath}/docs-fullscreen`
              const docsUrl = `${window.location.origin}${docsPath}`
              window.open(docsUrl, '_blank', 'noopener,noreferrer')
            }
            return (
              <button
                key={item.path}
                onClick={handleDocsClick}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded w-full text-left',
                  'transition-colors duration-150',
                  'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn(
                  'mr-3 h-5 w-5',
                  'text-gray-500'
                )} />
                {item.label}
                <svg className="ml-auto h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            )
          }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onMobileToggle}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded',
                  'transition-colors duration-150',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn(
                  'mr-3 h-5 w-5',
                  isActive 
                    ? 'text-white' 
                    : 'text-gray-500'
                )} />
                <span className={isActive ? 'font-semibold' : 'font-medium'}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
