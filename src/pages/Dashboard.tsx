import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Server, 
  Users, 
  FileText, 
  Heart, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import { companiesApi } from '../api/companies'
import { agreementsApi } from '../api/agreements'
import { healthApi } from '../api/health'
import { verificationApi } from '../api/verification'
import { logsApi } from '../api/logs'
import { formatDate } from '../lib/utils'
import { Link } from 'react-router-dom'
import http from '../lib/http'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'

export default function Dashboard() {
  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: () => companiesApi.listSources(),
  })

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => companiesApi.listAgents(),
  })

  const { data: agreements, isLoading: agreementsLoading } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => agreementsApi.listAgreements(),
  })

  const { data: health, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.getSourceHealth(),
    retry: 1,
  })

  const { data: verificationStatus, isLoading: verificationLoading, error: verificationError } = useQuery({
    queryKey: ['verification-status'],
    queryFn: () => verificationApi.getVerificationStatus(),
    retry: 1,
  })

  const { data: recentLogs, isLoading: logsLoading, error: logsError } = useQuery({
    queryKey: ['logs', 'recent-10'],
    queryFn: () => logsApi.listLogs({ limit: 10 }),
    retry: 1,
  })

  const { data: lastBookings, isLoading: bookingsLoading, error: bookingsError } = useQuery({
    queryKey: ['bookings', 'last-5'],
    queryFn: async () => {
      try {
        const { data } = await http.get('/bookings', { params: { limit: 5 } })
        // Handle both response formats
        if (Array.isArray(data)) {
          return data
        }
        if (data?.data && Array.isArray(data.data)) {
          return data.data
        }
        if (data?.items && Array.isArray(data.items)) {
          return data.items
        }
        return []
      } catch (error: any) {
        console.error('Error fetching bookings:', error)
        // Return empty array on error instead of throwing
        return []
      }
    },
    retry: 1,
  })

  const { data: systemStatus, isLoading: systemStatusLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const { data } = await http.get('/admin/system-status')
      return data
    },
    retry: 1,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Extract verification results - handle both formats (must be before any conditional returns)
  const recentVerifications = React.useMemo(() => {
    if (!verificationStatus) return []
    // New format: { status, last_verified, report: { test_results } }
    if (verificationStatus.report?.test_results) {
      return verificationStatus.report.test_results.slice(0, 5)
    }
    // Old format: { steps } - transform if needed (for backward compatibility)
    const statusAny = verificationStatus as any
    if (statusAny.steps && Array.isArray(statusAny.steps)) {
      return statusAny.steps.slice(0, 5).map((step: any) => ({
        name: step.name || step.step || 'Test',
        description: step.detail || step.message || '',
        status: step.passed ? 'PASSED' : 'FAILED',
        duration_ms: step.latency || 0,
      }))
    }
    return []
  }, [verificationStatus])

  const isLoading = sourcesLoading || agentsLoading || agreementsLoading || healthLoading || verificationLoading || logsLoading || bookingsLoading || systemStatusLoading

  // Calculate derived values (after all hooks)
  const activeSources = sources?.data?.filter(s => s.status === 'ACTIVE').length || 0
  const activeAgents = agents?.data?.filter(a => a.status === 'ACTIVE').length || 0
  const activeAgreements = agreements?.data?.filter(a => a.status === 'ACTIVE').length || 0
  const excludedSources = Array.isArray(health) ? health.filter((h) => h.status === 'EXCLUDED').length : 0
  const hasBookingErrors = (recentLogs?.data || []).some((log) =>
    (log.endpoint || '').toLowerCase().includes('booking') && (log.level === 'ERROR' || (log.http_status && log.http_status >= 400))
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gray-100 rounded">
              <TrendingUp className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Overview of your Gloria Connect system
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded">
              <TrendingUp className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Overview of your Gloria Connect system
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {excludedSources > 0 && (
              <Badge variant="warning">
                {excludedSources} source(s) excluded
              </Badge>
            )}
            {hasBookingErrors && (
              <Badge variant="danger">
                Booking errors detected
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Sources</p>
                <p className="text-3xl font-semibold text-gray-900 mb-1">
                  {sources?.data?.length || 0}
                </p>
                <p className="text-sm text-gray-600 flex items-center mt-2">
                  <span className="inline-block w-2 h-2 bg-green-600 rounded mr-2"></span>
                  {activeSources} active
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <Server className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Agents</p>
                <p className="text-3xl font-semibold text-gray-900 mb-1">
                  {agents?.data?.length || 0}
                </p>
                <p className="text-sm text-gray-600 flex items-center mt-2">
                  <span className="inline-block w-2 h-2 bg-green-600 rounded mr-2"></span>
                  {activeAgents} active
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <Users className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Active Agreements</p>
                <p className="text-3xl font-semibold text-gray-900 mb-1">
                  {activeAgreements}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {agreements?.data?.length || 0} total
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <FileText className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Excluded Sources</p>
                <p className="text-3xl font-semibold text-gray-900 mb-1">
                  {excludedSources}
                </p>
                <p className="text-sm text-red-600 flex items-center mt-2">
                  <span className="inline-block w-2 h-2 bg-red-600 rounded mr-2"></span>
                  Health issues
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <AlertTriangle className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded">
              <Server className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">System Status</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Real-time system component status</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {systemStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-4 rounded border ${
                systemStatus.grpcServices?.status === 'operational' 
                  ? 'bg-green-50 border-green-200' 
                  : systemStatus.grpcServices?.status === 'degraded'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {systemStatus.grpcServices?.status === 'operational' ? (
                    <div className="p-2 bg-green-100 rounded">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ) : systemStatus.grpcServices?.status === 'degraded' ? (
                    <div className="p-2 bg-yellow-100 rounded">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">gRPC Services</p>
                    <p className="text-xs text-gray-600">
                      {systemStatus.grpcServices?.message || 'Checking status...'}
                    </p>
                    <Badge 
                      variant={
                        systemStatus.grpcServices?.status === 'operational' ? 'success' :
                        systemStatus.grpcServices?.status === 'degraded' ? 'warning' : 'danger'
                      } 
                      size="sm" 
                      className="mt-2"
                    >
                      {systemStatus.grpcServices?.status || 'UNKNOWN'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded border ${
                systemStatus.jobQueue?.status === 'idle' 
                  ? 'bg-green-50 border-green-200'
                  : systemStatus.jobQueue?.status === 'processing'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  {systemStatus.jobQueue?.status === 'idle' ? (
                    <div className="p-2 bg-green-100 rounded">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ) : systemStatus.jobQueue?.status === 'processing' ? (
                    <div className="p-2 bg-blue-100 rounded">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-yellow-100 rounded">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Job Queue</p>
                    <p className="text-xs text-gray-600">
                      {systemStatus.jobQueue?.message || 'No active jobs'}
                    </p>
                    <Badge 
                      variant={
                        systemStatus.jobQueue?.status === 'idle' ? 'success' :
                        systemStatus.jobQueue?.status === 'processing' ? 'info' : 'warning'
                      } 
                      size="sm" 
                      className="mt-2"
                    >
                      {systemStatus.jobQueue?.status || 'UNKNOWN'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded border ${
                systemStatus.locationSync?.lastSync
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  {systemStatus.locationSync?.lastSync ? (
                    <div className="p-2 bg-green-100 rounded">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-yellow-100 rounded">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Location Sync</p>
                    <p className="text-xs text-gray-600">
                      {systemStatus.locationSync?.message || 'No location syncs recorded'}
                    </p>
                    <Badge 
                      variant={systemStatus.locationSync?.lastSync ? 'success' : 'warning'} 
                      size="sm" 
                      className="mt-2"
                    >
                      {systemStatus.locationSync?.lastSync ? 'Active' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center py-8">
              <Loader size="md" />
              <p className="text-sm text-gray-500 mt-3">Loading system status...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded">
                <CheckCircle className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Verification Results</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Latest source verification tests</p>
              </div>
            </div>
          </CardHeader>
        <CardContent className="pt-6">
          {verificationError ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Error loading verification status</p>
              <p className="text-xs mt-1">Check console for details</p>
            </div>
          ) : recentVerifications.length > 0 ? (
            <div className="space-y-3">
              {recentVerifications.map((test: any, index: number) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded border ${
                  test.status === 'PASSED' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">{test.name}</p>
                    {test.description && (
                      <p className="text-sm text-gray-600">{test.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={test.status === 'PASSED' ? 'success' : 'danger'}
                      size="sm"
                    >
                      {test.status}
                    </Badge>
                    {test.duration_ms && test.duration_ms > 0 && (
                      <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded">
                        {test.duration_ms}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Verification Results</h3>
              <p className="text-sm text-gray-500">Run verification to see results</p>
            </div>
          )}
        </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded">
                <Heart className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">System Health</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Source health monitoring status</p>
              </div>
            </div>
          </CardHeader>
        <CardContent className="pt-6">
          {healthError ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Error loading health data</p>
              <p className="text-xs mt-1">Check console for details</p>
            </div>
          ) : health && Array.isArray(health) && health.length > 0 ? (
            <div className="space-y-3">
              {health.slice(0, 5).map((source: any) => (
                <div key={source.companyId || source.sourceId} className={`flex items-center justify-between p-4 rounded border ${
                  source.status === 'HEALTHY' 
                    ? 'bg-green-50 border-green-200'
                    : source.status === 'SLOW'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">{source.companyName || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">{source.sampleCount || 0}</span> samples, <span className="font-semibold">{(source.slowRate || 0).toFixed(2)}%</span> slow rate
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={
                        source.status === 'HEALTHY' ? 'success' : 
                        source.status === 'SLOW' ? 'warning' : 'danger'
                      }
                      size="sm"
                    >
                      {source.status || 'UNKNOWN'}
                    </Badge>
                    {source.excludedUntil && (
                      <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded">
                        Until {formatDate(source.excludedUntil)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Heart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Health Data Available</h3>
              <p className="text-sm text-gray-500">Health monitoring will appear after sources process requests</p>
            </div>
          )}
        </CardContent>
        </Card>
      </div>

      {/* Last 5 bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded">
              <FileText className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Bookings</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Last 5 booking transactions</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {bookingsError ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Error loading bookings</p>
              <p className="text-xs mt-1">Check console for details</p>
            </div>
          ) : lastBookings && Array.isArray(lastBookings) && lastBookings.length > 0 ? (
            <div className="space-y-3">
              {lastBookings.map((b: any, idx: number) => {
                const status = (b.status || '').toUpperCase()
                const variant = status === 'CONFIRMED' ? 'success' : status === 'CANCELLED' ? 'danger' : 'warning'
                const bookingRef = b.booking_ref || b.bookingRef || b.id || `Booking ${idx + 1}`
                const vehicleInfo = b.vehicle_info?.vehicle_make_model || b.vehicle_make_model || 'Vehicle'
                const sourceId = b.source_id || b.sourceId || 'unknown'
                const createdAt = b.created_at || b.createdAt || b.createdAt
                return (
                  <div key={b.id || idx} className={`flex items-center justify-between p-4 rounded border ${
                    variant === 'success' 
                      ? 'bg-green-50 border-green-200'
                      : variant === 'danger'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Badge variant={variant as any} size="sm">{status || 'PENDING'}</Badge>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{vehicleInfo}</div>
                        <div className="text-xs text-gray-600">Source: {sourceId.slice(0, 10)}</div>
                      </div>
                      {bookingRef && (
                        <code className="text-xs bg-white px-2 py-1 rounded font-mono font-bold">{bookingRef.slice(0, 8)}</code>
                      )}
                    </div>
                    {createdAt && (
                      <div className="text-xs font-semibold text-gray-600">{formatDate(createdAt)}</div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Bookings</h3>
              <p className="text-sm text-gray-500">Bookings will appear here once created</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded">
              <FileText className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Logs</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Latest system activity and events</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {logsError ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Error loading logs</p>
              <p className="text-xs mt-1">Check console for details</p>
            </div>
          ) : recentLogs?.data && Array.isArray(recentLogs.data) && recentLogs.data.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.data.map((log) => (
                <div key={log.id} className={`flex items-center justify-between p-4 rounded border ${
                  log.level === 'ERROR' 
                    ? 'bg-red-50 border-red-200'
                    : log.level === 'WARN'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={
                        log.level === 'ERROR' ? 'danger' :
                        log.level === 'WARN' ? 'warning' : 'info'
                      }
                      size="sm"
                    >
                      {log.level || 'INFO'}
                    </Badge>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 block">{log.endpoint || log.message || 'unknown'}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {log.companyId && (
                          <span className="text-xs text-gray-600">Company: <span className="font-mono font-bold">{log.companyId.slice(0, 8)}</span></span>
                        )}
                        {log.requestId && (
                          <code className="text-[10px] bg-white px-2 py-0.5 rounded font-mono font-bold">{log.requestId.slice(0, 8)}</code>
                        )}
                      </div>
                    </div>
                  </div>
                  {log.timestamp && (
                    <span className="text-xs font-semibold text-gray-600">{formatDate(log.timestamp)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Logs Available</h3>
              <p className="text-sm text-gray-500">System logs will appear here as requests are processed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded">
              <TrendingUp className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Common administrative tasks</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/verification">
              <Button className="w-full justify-start" variant="primary">
                <CheckCircle className="h-4 w-4 mr-2" />
                Run Source Verification
              </Button>
            </Link>
            <Link to="/health">
              <Button className="w-full justify-start" variant="primary">
                <Heart className="h-4 w-4 mr-2" />
                Check System Health
              </Button>
            </Link>
            <Link to="/metrics">
              <Button className="w-full justify-start" variant="primary">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Metrics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
