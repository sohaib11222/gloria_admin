import React from 'react'
import { AppRoutes } from './routes'
import { AppProvider } from './state/useAppStore'
import { SearchProvider } from './contexts/SearchContext'

function App() {
  return (
    <AppProvider>
      <SearchProvider>
        <AppRoutes />
      </SearchProvider>
    </AppProvider>
  )
}

export default App
