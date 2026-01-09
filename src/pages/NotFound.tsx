import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Home, ArrowLeft, Search, AlertCircle } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Number with gradient */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-7xl sm:text-9xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full shadow-xl">
            <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-lg sm:text-xl text-gray-600 mb-2">
          Oops! The page you're looking for doesn't exist.
        </p>
        <p className="text-base sm:text-lg text-gray-500 mb-10">
          It might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-3 text-base shadow-lg hover:shadow-xl transition-all"
          >
            <Home className="h-5 w-5" />
            Go to Dashboard
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 text-base"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </Button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-4">Quick Links:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { path: '/dashboard', label: 'Dashboard' },
              { path: '/companies', label: 'Companies' },
              { path: '/agents', label: 'Agents' },
              { path: '/sources', label: 'Sources' },
              { path: '/metrics', label: 'Metrics' },
              { path: '/health', label: 'Health' },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Suggestion */}
        <div className="mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Search className="h-5 w-5" />
            <span className="text-sm">
              Try using the search function or navigation menu to find what you're looking for.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

