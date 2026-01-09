import React from 'react'
import { AppRoutes } from './routes'
import { AppProvider } from './state/useAppStore'
import { SearchProvider } from './contexts/SearchContext'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <SearchProvider>
          <AppRoutes />
        </SearchProvider>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App
