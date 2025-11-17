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

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.getSourceHealth(),
  })

  const { data: verificationStatus, isLoading: verificationLoading } = useQuery({
    queryKey: ['verification-status'],
    queryFn: () => verificationApi.getVerificationStatus(),
  })

  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['logs', 'recent-10'],
    queryFn: () => logsApi.listLogs({ limit: 10 }),
  })

  const { data: lastBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', 'last-5'],
    queryFn: async () => {
      const { data } = await http.get('/bookings', { params: { limit: 5 } })
      return (data?.data ?? data ?? []) as any[]
    },
  })

  const isLoading = sourcesLoading || agentsLoading || agreementsLoading || healthLoading || verificationLoading || logsLoading || bookingsLoading

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

  const activeSources = sources?.data?.filter(s => s.status === 'ACTIVE').length || 0
  const activeAgents = agents?.data?.filter(a => a.status === 'ACTIVE').length || 0
  const activeAgreements = agreements?.data?.filter(a => a.status === 'ACTIVE').length || 0
  const excludedSources = Array.isArray(health) ? health.filter((h) => h.status === 'EXCLUDED').length : 0
  const hasBookingErrors = (recentLogs?.data || []).some((log) =>
    (log.endpoint || '').toLowerCase().includes('booking') && (log.level === 'ERROR' || (log.http_status && log.http_status >= 400))
  )

  const recentVerifications = verificationStatus?.report?.test_results?.slice(0, 5) || []

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">gRPC Services</p>
                <p className="text-xs text-gray-600 mt-1">All services operational</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Job Queue</p>
                <p className="text-xs text-gray-600 mt-1">Processing availability requests</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Location Sync</p>
                <p className="text-xs text-gray-600 mt-1">Last sync: 2 hours ago (mocked)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Verification Results</CardTitle>
          </CardHeader>
          <CardContent>
            {recentVerifications.length > 0 ? (
              <div className="space-y-3">
                {recentVerifications.map((test, index) => (
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
                      {test.duration_ms && (
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
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            {health && health.length > 0 ? (
              <div className="space-y-3">
                {health.slice(0, 5).map((source) => (
                  <div key={source.companyId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{source.companyName}</p>
                      <p className="text-sm text-gray-600">
                        {source.sampleCount} samples, {source.slowRate.toFixed(2)}% slow rate
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
                        {source.status}
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
          {lastBookings && lastBookings.length > 0 ? (
            <div className="space-y-2">
              {lastBookings.map((b: any, idx: number) => {
                const status = (b.status || '').toUpperCase()
                const variant = status === 'CONFIRMED' ? 'success' : status === 'CANCELLED' ? 'danger' : 'warning'
                return (
                  <div key={b.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={variant as any} size="sm">{status || 'PENDING'}</Badge>
                      <div className="text-sm text-gray-900">
                        {(b.vehicle_info?.vehicle_make_model || b.vehicle_make_model || 'Booking')} — {b.source_id?.slice(0,10) || 'source'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{formatDate(b.created_at || b.createdAt || new Date().toISOString())}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No recent bookings</div>
          )}
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs?.data && recentLogs.data.length > 0 ? (
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
                      {log.level}
                    </Badge>
                    <span className="text-sm text-gray-900">{log.endpoint || 'unknown'}</span>
                    {log.companyId && (
                      <span className="text-xs text-gray-500">company: {log.companyId}</span>
                    )}
                    {log.requestId && (
                      <code className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">{log.requestId}</code>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No logs available</div>
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
