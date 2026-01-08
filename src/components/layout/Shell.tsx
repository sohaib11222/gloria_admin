import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { SearchPalette } from '../SearchPalette'
import { useSearch } from '../../contexts/SearchContext'
import { Menu } from 'lucide-react'

export const Shell: React.FC = () => {
  const location = useLocation()
  const { isOpen, openSearch, closeSearch } = useSearch()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
      }
      if (e.key === 'Escape' && isOpen) {
        closeSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, openSearch, closeSearch])

  return (
    <>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">Car Hire Middleware</h1>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        <Sidebar mobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Mobile topbar spacing */}
          <div className="lg:hidden h-16"></div>
          <Topbar />
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-3 text-sm text-gray-600">
              <nav className="flex items-center space-x-1">
                <span className="text-gray-500">Home</span>
                {location.pathname.split('/').filter(Boolean).map((seg, idx) => (
                  <span key={idx}>
                    <span className="mx-2 text-gray-300">/</span>
                    <span className="capitalize text-gray-900 font-medium">{seg.replace(/-/g, ' ')}</span>
                  </span>
                ))}
              </nav>
            </div>
          </div>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <SearchPalette isOpen={isOpen} onClose={closeSearch} />
    </>
  )
}
