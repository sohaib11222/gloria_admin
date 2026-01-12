import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProfessionalToaster } from './components/ui/ToastConfig'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Get base path from Vite config (matches vite.config.js base setting)
// Vite config uses '/admin/' so we need to use '/admin' for React Router basename
const getBasePath = () => {
  // Always use /admin to match vite.config.js base: '/admin/'
  // This ensures routes work correctly in both dev and prod
  return '/admin'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        basename={getBasePath()}
        future={{
          v7_relativeSplatPath: true,
        }}
      >
        <App />
        <ProfessionalToaster />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
