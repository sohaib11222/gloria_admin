import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
          'w-64 bg-white border-r border-gray-200 shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          'flex flex-col h-screen lg:h-auto',
          'backdrop-blur-sm bg-white/95',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center px-6 py-5 border-b border-blue-500/20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Car Hire</h1>
              <p className="text-xs text-blue-100 font-medium">Middleware</p>
            </div>
          </div>
          {onMobileToggle && (
            <button
              onClick={onMobileToggle}
              className="lg:hidden ml-auto p-2 text-white hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
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
            // Get base path for production
            const basePath = import.meta.env.PROD ? '/admin' : ''
            const docsPath = `${basePath}/docs-fullscreen`
            return (
              <a
                key={item.path}
                href={docsPath}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onMobileToggle}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg',
                  'transition-all duration-200 group',
                  'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50',
                  'hover:text-blue-700 hover:shadow-sm',
                  'border border-transparent hover:border-blue-200'
                )}
              >
                  <Icon className={cn(
                    'mr-3 h-5 w-5 transition-all duration-200',
                    'text-gray-500 group-hover:text-blue-600 group-hover:scale-110'
                  )} />
                  {item.label}
                  <svg className="ml-auto h-3 w-3 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onMobileToggle}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg',
                  'transition-all duration-200 group relative',
                  'border border-transparent',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 border-blue-500'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-sm hover:border-blue-200'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-sm" />
                )}
                <Icon className={cn(
                  'mr-3 h-5 w-5 transition-all duration-200',
                  isActive 
                    ? 'text-white scale-110' 
                    : 'text-gray-500 group-hover:text-blue-600 group-hover:scale-110'
                )} />
                <span className={cn(
                  'transition-all duration-200',
                  isActive ? 'font-semibold' : 'font-medium group-hover:font-semibold'
                )}>
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
