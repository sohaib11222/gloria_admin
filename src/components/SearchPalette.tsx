import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight } from 'lucide-react'
import { cn } from '../lib/utils'

interface SearchItem {
  id: string
  label: string
  category: string
  path: string
  icon?: string
}

const searchItems: SearchItem[] = [
  { id: 'dashboard', label: 'Dashboard', category: 'Navigation', path: '/dashboard', icon: '📊' },
  { id: 'companies', label: 'Companies', category: 'Navigation', path: '/companies', icon: '🏢' },
  { id: 'agents', label: 'Agents', category: 'Navigation', path: '/agents', icon: '👥' },
  { id: 'sources', label: 'Sources', category: 'Navigation', path: '/sources', icon: '🔌' },
  { id: 'agreements', label: 'Agreements', category: 'Navigation', path: '/agreements-management', icon: '📄' },
  { id: 'locations', label: 'Locations', category: 'Navigation', path: '/locations', icon: '📍' },
  { id: 'availability', label: 'Availability Test', category: 'Tools', path: '/availability', icon: '🔍' },
  { id: 'bookings', label: 'Booking Logs', category: 'Logs', path: '/booking-logs', icon: '📝' },
  { id: 'health', label: 'Health Monitoring', category: 'Monitoring', path: '/health', icon: '❤️' },
  { id: 'activity', label: 'Activity & Audit', category: 'Logs', path: '/activity', icon: '📊' },
  { id: 'logs', label: 'System Logs', category: 'Logs', path: '/logs', icon: '📋' },
  { id: 'metrics', label: 'Metrics', category: 'Monitoring', path: '/metrics', icon: '📈' },
  { id: 'verification', label: 'Verification', category: 'Tools', path: '/verification', icon: '✅' },
  { id: 'docs', label: 'API Reference', category: 'Documentation', path: '/docs-fullscreen', icon: '📖' },
  { id: 'integrations', label: 'Integrations', category: 'Settings', path: '/integrations', icon: '🔧' },
  { id: 'changelog', label: "What's New", category: 'Documentation', path: '/changelog', icon: '🆕' },
  { id: 'settings', label: 'Settings', category: 'Settings', path: '/settings', icon: '⚙️' },
]

export const SearchPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  const filteredItems = useMemo(() => {
    if (!query.trim()) return searchItems.slice(0, 8) // Show top 8 when no query

    const lowerQuery = query.toLowerCase()
    return searchItems.filter(item => 
      item.label.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    )
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filteredItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selectedItem = filteredItems[selectedIndex]
      if (selectedItem) {
        navigate(selectedItem.path)
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const groupedItems = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {}
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })
    return groups
  }, [filteredItems])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-50" onClick={onClose} />
      
      {/* Palette */}
      <div className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-2xl z-50">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search input */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, agreements, logs..."
                className="flex-1 outline-none text-base"
                autoFocus
              />
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded">ESC</kbd>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                <p>No results found</p>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {category}
                    </div>
                    {items.map((item, idx) => {
                      const globalIdx = filteredItems.indexOf(item)
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === 'docs') {
                              // Open docs in new tab
                              // Base path is always /admin to match vite.config.js and React Router basename
                              const basePath = '/admin'
                              const docsUrl = `${window.location.origin}${basePath}/docs-fullscreen`
                              window.open(docsUrl, '_blank', 'noopener,noreferrer')
                            } else {
                              navigate(item.path)
                            }
                            onClose()
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={cn(
                            'w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-blue-50 transition-colors',
                            selectedIndex === globalIdx && 'bg-blue-50'
                          )}
                        >
                          <span className="text-xl flex-shrink-0">{item.icon}</span>
                          <span className="flex-1 text-sm font-medium text-gray-900">{item.label}</span>
                          <ArrowRight className={cn(
                            'h-4 w-4 text-gray-400',
                            selectedIndex === globalIdx && 'text-blue-600'
                          )} />
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Navigate with ↑↓ and press Enter</span>
              <kbd className="px-2 py-1 bg-white rounded border border-gray-300">↵</kbd>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

