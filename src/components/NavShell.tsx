import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAtom } from 'jotai'
import { userAtom } from '../store/auth'
import { useAppStore } from '../state/useAppStore'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'

export const NavShell: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = useAppStore()
  const [user] = useAtom(userAtom)

  const handleLogout = () => {
    // Clear authentication tokens
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    navigate('/login')
  }

  const navItems = [
    { path: '/connectivity', label: 'Connectivity', icon: '🔗' },
    { path: '/agent', label: 'Agent', icon: '🤖' },
    { path: '/companies', label: 'Companies', icon: '🏢' },
    { path: '/agreements-management', label: 'Agreements', icon: '📋' },
    { path: '/registration', label: 'Registration', icon: '📝' },
  ]

  // Add agreements tab if not accepted
  if (!state.agreementsAccepted) {
    navItems.unshift({ path: '/agreements', label: 'Agreements', icon: '📋' })
  }

  // Filter items based on role
  const visibleItems = state.role === 'viewer' 
    ? navItems.filter(item => item.path !== '/registration')
    : navItems

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">{import.meta.env.VITE_APP_NAME || 'Admin UI'}</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <Badge variant="info">{state.role}</Badge>
                {!state.agreementsAccepted && (
                  <Badge variant="warning">Agreements Pending</Badge>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                  {(user?.email || 'U').substring(0, 1).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm text-gray-700">{user?.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <nav className="text-sm text-gray-500">
            {location.pathname.split('/').filter(Boolean).length === 0 ? (
              <span>Home</span>
            ) : (
              <span>Home</span>
            )}
            {location.pathname.split('/').filter(Boolean).map((seg, idx, arr) => (
              <span key={idx}>
                {' '}/{' '}
                <span className="capitalize">{seg.replace(/-/g, ' ')}</span>
              </span>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
