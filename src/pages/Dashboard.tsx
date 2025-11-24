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
    return <Loader className="min-h-96" />
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          {excludedSources > 0 && (
            <Badge variant="warning">{excludedSources} source(s) excluded</Badge>
          )}
          {hasBookingErrors && (
            <Badge variant="danger">Booking errors detected</Badge>
          )}
        </div>
        <p className="mt-2 text-gray-600">
          Overview of your Car Hire Middleware system
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-blue-100 rounded-xl">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Sources</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {sources?.data?.length || 0}
                </p>
                <p className="text-sm text-green-600 font-semibold flex items-center mt-1">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {activeSources} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-green-100 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Agents</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {agents?.data?.length || 0}
                </p>
                <p className="text-sm text-green-600 font-semibold flex items-center mt-1">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {activeAgents} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-purple-100 rounded-xl">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Agreements</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {activeAgreements}
                </p>
                <p className="text-sm text-gray-600 font-semibold mt-1">
                  {agreements?.data?.length || 0} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Excluded Sources</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {excludedSources}
                </p>
                <p className="text-sm text-red-600 font-semibold flex items-center mt-1">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Health issues
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                {systemStatus.grpcServices?.status === 'operational' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : systemStatus.grpcServices?.status === 'degraded' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">gRPC Services</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {systemStatus.grpcServices?.message || 'Checking status...'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                {systemStatus.jobQueue?.status === 'idle' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : systemStatus.jobQueue?.status === 'processing' ? (
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">Job Queue</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {systemStatus.jobQueue?.message || 'No active jobs'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                {systemStatus.locationSync?.lastSync ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">Location Sync</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {systemStatus.locationSync?.message || 'No location syncs recorded'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center py-4">
              <Loader size="sm" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Verification Results</CardTitle>
          </CardHeader>
        <CardContent>
          {verificationError ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Error loading verification status</p>
              <p className="text-xs mt-1">Check console for details</p>
            </div>
          ) : recentVerifications.length > 0 ? (
            <div className="space-y-3">
              {recentVerifications.map((test: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{test.name}</p>
                    {test.description && (
                      <p className="text-sm text-gray-600">{test.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={test.status === 'PASSED' ? 'success' : 'danger'}
                      size="sm"
                    >
                      {test.status}
                    </Badge>
                    {test.duration_ms && test.duration_ms > 0 && (
                      <span className="text-xs text-gray-500">
                        {test.duration_ms}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent verification results</p>
              <p className="text-xs mt-1">Run verification to see results</p>
            </div>
          )}
        </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
        <CardContent>
          {healthError ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Error loading health data</p>
              <p className="text-xs mt-1">Check console for details</p>
            </div>
          ) : health && Array.isArray(health) && health.length > 0 ? (
            <div className="space-y-3">
              {health.slice(0, 5).map((source: any) => (
                <div key={source.companyId || source.sourceId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{source.companyName || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">
                      {source.sampleCount || 0} samples, {(source.slowRate || 0).toFixed(2)}% slow rate
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
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
                      <span className="text-xs text-gray-500">
                        Until {formatDate(source.excludedUntil)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No health data available</p>
              <p className="text-xs mt-1">Health monitoring will appear after sources process requests</p>
            </div>
          )}
        </CardContent>
        </Card>
      </div>

      {/* Last 5 bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Last 5 bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsError ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Error loading bookings</p>
              <p className="text-xs mt-1">Check console for details</p>
            </div>
          ) : lastBookings && Array.isArray(lastBookings) && lastBookings.length > 0 ? (
            <div className="space-y-2">
              {lastBookings.map((b: any, idx: number) => {
                const status = (b.status || '').toUpperCase()
                const variant = status === 'CONFIRMED' ? 'success' : status === 'CANCELLED' ? 'danger' : 'warning'
                const bookingRef = b.booking_ref || b.bookingRef || b.id || `Booking ${idx + 1}`
                const vehicleInfo = b.vehicle_info?.vehicle_make_model || b.vehicle_make_model || 'Vehicle'
                const sourceId = b.source_id || b.sourceId || 'unknown'
                const createdAt = b.created_at || b.createdAt || b.createdAt
                return (
                  <div key={b.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={variant as any} size="sm">{status || 'PENDING'}</Badge>
                      <div className="text-sm text-gray-900">
                        {vehicleInfo} — {sourceId.slice(0, 10)}
                      </div>
                      {bookingRef && (
                        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{bookingRef.slice(0, 8)}</code>
                      )}
                    </div>
                    {createdAt && (
                      <div className="text-xs text-gray-500">{formatDate(createdAt)}</div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent bookings</p>
              <p className="text-xs mt-1">Bookings will appear here once created</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logsError ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Error loading logs</p>
              <p className="text-xs mt-1">Check console for details</p>
            </div>
          ) : recentLogs?.data && Array.isArray(recentLogs.data) && recentLogs.data.length > 0 ? (
            <div className="space-y-2">
              {recentLogs.data.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        log.level === 'ERROR' ? 'danger' :
                        log.level === 'WARN' ? 'warning' : 'info'
                      }
                      size="sm"
                    >
                      {log.level || 'INFO'}
                    </Badge>
                    <span className="text-sm text-gray-900">{log.endpoint || log.message || 'unknown'}</span>
                    {log.companyId && (
                      <span className="text-xs text-gray-500">company: {log.companyId.slice(0, 8)}</span>
                    )}
                    {log.requestId && (
                      <code className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">{log.requestId.slice(0, 8)}</code>
                    )}
                  </div>
                  {log.timestamp && (
                    <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No logs available</p>
              <p className="text-xs mt-1">System logs will appear here as requests are processed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/verification">
              <Button className="w-full justify-start group hover:scale-105 transition-transform" variant="secondary">
                <CheckCircle className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                Run Source Verification
              </Button>
            </Link>
            <Link to="/health">
              <Button className="w-full justify-start group hover:scale-105 transition-transform" variant="secondary">
                <Heart className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                Check System Health
              </Button>
            </Link>
            <Link to="/metrics">
              <Button className="w-full justify-start group hover:scale-105 transition-transform" variant="secondary">
                <TrendingUp className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                View Metrics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
