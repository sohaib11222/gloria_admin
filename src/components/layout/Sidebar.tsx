import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { NAVIGATION_ITEMS } from '../../lib/constants'
import * as Icons from 'lucide-react'

export const Sidebar: React.FC = () => {
  const location = useLocation()

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-full shadow-sm">
      <div className="flex items-center px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
        <h1 className="text-xl font-bold text-white">Car Hire Middleware</h1>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = Icons[item.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
          
          return (
            <Link
              key={item.path}
              to={item.path}
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
  )
}
