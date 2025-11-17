import React from 'react'
import { Toaster } from 'react-hot-toast'
import { AppRoutes } from './routes'
import { AppProvider } from './state/useAppStore'
import { SearchProvider } from './contexts/SearchContext'

function App() {
  return (
    <AppProvider>
      <SearchProvider>
        <AppRoutes />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </SearchProvider>
    </AppProvider>
  )
}

export default App
