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
          'w-64 bg-white border-r border-gray-200 shadow-sm',
          'transform transition-transform duration-300 ease-in-out',
          'flex flex-col h-screen lg:h-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h1 className="text-xl font-bold text-white">Car Hire Middleware</h1>
          {onMobileToggle && (
            <button
              onClick={onMobileToggle}
              className="lg:hidden ml-auto p-1 text-white hover:bg-blue-700 rounded"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                )}
              >
                  <Icon className={cn(
                    'mr-3 h-5 w-5 transition-transform duration-200 text-gray-500 group-hover:text-blue-600'
                  )} />
                  {item.label}
                  <svg className="ml-auto h-3 w-3 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                )}
              >
                <Icon className={cn(
                  'mr-3 h-5 w-5 transition-transform duration-200',
                  isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                )} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
