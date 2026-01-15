import { useState, useEffect } from 'react'
import { useAppStore } from '../state/useAppStore'
import { getUiConfig } from '../api/client'
import { companiesApi } from '../api/companies'
import { ConnectivityTests } from '../components/ConnectivityTests'
import { CompaniesTable } from '../components/CompaniesTable'
import { LogsTable } from '../components/LogsTable'
import { Loader } from '../components/ui/Loader'
import toast from 'react-hot-toast'
import { logsApi } from '../api/logs'

interface SystemLogEntry {
  id: string
  direction: string
  endpoint: string
  requestId: string | null
  companyId: string | null
  sourceId: string | null
  httpStatus: number | null
  grpcStatus: string | null
  maskedRequest: string
  maskedResponse: any
  durationMs: number
  createdAt: string
  status: string
  duration: string
  requestSize: number
  responseSize: number
}

export default function ConnectivityPage() {
  const { setAddresses, setFeatures } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [uiConfig, setUiConfig] = useState<any>(null)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'connectivity' | 'companies' | 'logs'>('connectivity')
  const [companies, setCompanies] = useState<Array<{
    id: string
    companyName: string
    type: string
    email: string
    status: string
    grpcEndpoint?: string | null
  }>>([])
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const [logs, setLogs] = useState<SystemLogEntry[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      // Load UI config
      const config = await getUiConfig()
      setUiConfig(config)
      setAddresses(config.defaults || {})
      setFeatures(config.features || {})
      
      // Set health status (simplified for now)
      setHealthStatus({ status: 'HEALTHY' })
      
      // Load companies and logs
      await loadCompanies()
      await loadLogs()
    } catch (error) {
      console.error('Failed to load initial data:', error)
      toast.error('Failed to load initial data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCompanies = async () => {
    setIsLoadingCompanies(true)
    try {
      const response = await companiesApi.listCompanies()
      setCompanies(response.data)
    } catch (error) {
      console.error('Failed to load companies:', error)
      toast.error('Failed to load companies')
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  const loadLogs = async () => {
    setIsLoadingLogs(true)
    try {
      const data = await logsApi.listSystemLogs({ limit: 100 })
      setLogs(data.items || [])
    } catch (error: any) {
      console.error('Failed to load logs:', error)
      const message = error?.response?.data?.message || error?.message || 'Failed to load logs'
      toast.error(message)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Connectivity Tests</h1>
          <p className="mt-2 text-gray-600">
            Test gRPC connections and view system logs
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('connectivity')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'connectivity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Connectivity Tests
              </button>
              <button
                onClick={() => {
                  setActiveTab('companies')
                  if (companies.length === 0) loadCompanies()
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'companies'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Companies
              </button>
              <button
                onClick={() => {
                  setActiveTab('logs')
                  if (logs.length === 0) loadLogs()
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Logs
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'connectivity' && (
          <ConnectivityTests 
            uiConfig={uiConfig}
            healthStatus={healthStatus}
            onConfigLoad={setUiConfig}
          />
        )}

        {activeTab === 'companies' && (
          <CompaniesTable 
            companies={companies}
            isLoading={isLoadingCompanies}
            onLoadCompanies={loadCompanies}
          />
        )}

        {activeTab === 'logs' && (
          <LogsTable 
            logs={logs}
            isLoading={isLoadingLogs}
          />
        )}
      </div>
    </div>
  )
}