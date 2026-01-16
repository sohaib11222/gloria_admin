import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { logsApi } from '../api/logs'
import http from '../lib/http'
import { formatDate } from '../lib/utils'
import { Filter, RefreshCw, Search, X, Clock, CheckCircle, XCircle, AlertTriangle, Activity as ActivityIcon, Users, Server, Shield, Zap, ChevronLeft, ChevronRight } from 'lucide-react'

type ActivityType = 'all' | 'booking' | 'availability' | 'health' | 'admin'
type ActivityActor = 'agent' | 'source' | 'admin' | 'system'

interface ActivityEntry {
  id: string
  timestamp: string
  actor: ActivityActor
  action: string
  resource: string
  result: 'success' | 'error' | 'warning'
  details?: string
}

export default function Activity() {
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState<ActivityType>('all')
  const [selectedActor, setSelectedActor] = useState<ActivityActor | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Fetch from admin logs endpoint
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['activity-logs', selectedType, selectedActor, searchQuery],
    queryFn: async () => {
      try {
        const { data } = await http.get('/admin/logs', {
          params: {
            limit: 200,
            // Map activity type to endpoint filter
            ...(selectedType === 'booking' && { endpoint: 'booking' }),
            ...(selectedType === 'availability' && { endpoint: 'availability' }),
            ...(selectedType === 'health' && { endpoint: 'health' }),
            ...(selectedType === 'admin' && { endpoint: 'admin' }),
            ...(searchQuery && { q: searchQuery }),
          },
        })
        return data
      } catch (error) {
        console.error('Failed to fetch activity logs:', error)
        return null
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Transform backend data to ActivityEntry format
  const activities: ActivityEntry[] = useMemo(() => {
    if (!logsData) return []
    
    // Use activities array if available, otherwise transform from items
    const rawActivities = logsData.activities || logsData.items || []
    
    return rawActivities.map((item: any) => {
      // If already in ActivityEntry format, use it
      if (item.actor && item.action && item.resource && item.result) {
        return {
          id: item.id,
          timestamp: item.timestamp || item.createdAt,
          actor: item.actor as ActivityActor,
          action: item.action,
          resource: item.resource,
          result: item.result as 'success' | 'error' | 'warning',
          details: item.details,
        }
      }
      
      // Otherwise transform from audit log format
      const endpoint = item.endpoint || ''
      let actor: ActivityActor = 'system'
      if (endpoint.startsWith('admin.')) actor = 'admin'
      else if (item.companyType === 'AGENT') actor = 'agent'
      else if (item.companyType === 'SOURCE' || item.sourceType === 'SOURCE') actor = 'source'
      
      const actionParts = endpoint.split('.')
      const action = actionParts.length >= 2
        ? `${actionParts[actionParts.length - 1].charAt(0).toUpperCase() + actionParts[actionParts.length - 1].slice(1)} ${actionParts[0]}`
        : endpoint.replace(/\./g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      
      let resource = 'System resource'
      if (item.agreementRef) resource = `Agreement ${item.agreementRef}`
      else if (item.requestId) resource = `Request ${item.requestId.slice(0, 16)}...`
      else if (item.companyName) resource = item.companyName
      else if (item.sourceName) resource = item.sourceName
      else if (endpoint.includes('booking')) resource = 'Booking operation'
      else if (endpoint.includes('availability')) resource = 'Availability request'
      else if (endpoint.includes('agreement')) resource = 'Agreement'
      else if (endpoint.includes('health')) resource = 'Health check'
      else if (endpoint.includes('location')) resource = 'Location sync'
      
      const result: 'success' | 'error' | 'warning' = 
        (item.httpStatus && item.httpStatus >= 400) || (item.grpcStatus && item.grpcStatus !== 0)
          ? 'error'
          : (item.httpStatus && item.httpStatus >= 300)
          ? 'warning'
          : 'success'
      
      let details: string | undefined = undefined
      if (item.durationMs) {
        details = `Duration: ${item.durationMs}ms`
      }
      if (item.httpStatus && item.httpStatus >= 400) {
        details = details ? `${details}, HTTP ${item.httpStatus}` : `HTTP ${item.httpStatus}`
      }
      if (item.grpcStatus && item.grpcStatus !== 0) {
        details = details ? `${details}, gRPC ${item.grpcStatus}` : `gRPC ${item.grpcStatus}`
      }
      
      return {
        id: item.id,
        timestamp: item.timestamp || item.createdAt,
        actor,
        action,
        resource,
        result,
        details,
      }
    })
  }, [logsData])

  // Mock data for when backend doesn't have this (fallback)
  const mockActivities: ActivityEntry[] = useMemo(() => [
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      actor: 'agent',
      action: 'Submitted availability request',
      resource: 'Request ABC123',
      result: 'success',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      actor: 'source',
      action: 'Created booking',
      resource: 'Booking REF456',
      result: 'success',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      actor: 'source',
      action: 'Health check failed',
      resource: 'Source SlowRate',
      result: 'error',
      details: 'Response time 4.2s (threshold: 3s)',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      actor: 'admin',
      action: 'Reset source health',
      resource: 'Source CarCo',
      result: 'success',
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      actor: 'agent',
      action: 'Accepted agreement',
      resource: 'Agreement AG-2025-123',
      result: 'success',
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      actor: 'source',
      action: 'Offered agreement',
      resource: 'Agent TravelMe',
      result: 'success',
    },
    {
      id: '7',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      actor: 'system',
      action: 'Scheduled location sync',
      resource: 'Source AllLocations',
      result: 'success',
    },
  ], [])

  // Use real activities if available, otherwise fall back to mock
  const finalActivities = activities.length > 0 ? activities : mockActivities

  const filteredActivities = useMemo(() => {
    return finalActivities.filter((activity) => {
      const matchesType =
        selectedType === 'all' ||
        (selectedType === 'booking' && activity.action.toLowerCase().includes('booking')) ||
        (selectedType === 'availability' && activity.action.toLowerCase().includes('availability')) ||
        (selectedType === 'health' && activity.action.toLowerCase().includes('health')) ||
        (selectedType === 'admin' && activity.actor === 'admin')
      
      const matchesActor = selectedActor === 'all' || activity.actor === selectedActor
      const matchesSearch = searchQuery === '' || 
        activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.resource.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesType && matchesActor && matchesSearch
    })
  }, [finalActivities, selectedType, selectedActor, searchQuery])

  // Pagination calculations
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedType, selectedActor, searchQuery])

  const getActorBadge = (actor: ActivityActor) => {
    const badges = {
      agent: { variant: 'info' as const, label: 'Agent', icon: Users },
      source: { variant: 'warning' as const, label: 'Source', icon: Server },
      admin: { variant: 'default' as const, label: 'Admin', icon: Shield },
      system: { variant: 'default' as const, label: 'System', icon: Zap },
    }
    return badges[actor] || { variant: 'default' as const, label: actor, icon: ActivityIcon }
  }

  const getResultBadge = (result: ActivityEntry['result']) => {
    const badges = {
      success: { variant: 'success' as const, icon: CheckCircle },
      error: { variant: 'danger' as const, icon: XCircle },
      warning: { variant: 'warning' as const, icon: AlertTriangle },
    }
    return badges[result]
  }

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredActivities.length
    const success = filteredActivities.filter(a => a.result === 'success').length
    const errors = filteredActivities.filter(a => a.result === 'error').length
    const warnings = filteredActivities.filter(a => a.result === 'warning').length
    
    const byActor = {
      agent: filteredActivities.filter(a => a.actor === 'agent').length,
      source: filteredActivities.filter(a => a.actor === 'source').length,
      admin: filteredActivities.filter(a => a.actor === 'admin').length,
      system: filteredActivities.filter(a => a.actor === 'system').length,
    }
    
    return { total, success, errors, warnings, byActor }
  }, [filteredActivities])

  const hasActiveFilters = selectedType !== 'all' || selectedActor !== 'all' || searchQuery

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity & Audit Log</h1>
          <p className="mt-2 text-gray-600">
            View all system activity and audit events in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
            Auto-refresh: 30s
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ActivityIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.success}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.errors}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.warnings}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Zap className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <CardTitle>Filters</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedType('all')
                  setSelectedActor('all')
                  setSearchQuery('')
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ActivityType)}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'booking', label: 'Booking' },
                  { value: 'availability', label: 'Availability' },
                  { value: 'health', label: 'Health' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actor</label>
              <Select
                value={selectedActor}
                onChange={(e) => setSelectedActor(e.target.value as ActivityActor | 'all')}
                options={[
                  { value: 'all', label: 'All Actors' },
                  { value: 'agent', label: 'Agent' },
                  { value: 'source', label: 'Source' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'system', label: 'System' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <Input
                placeholder="Search actions or resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredActivities.length} of {finalActivities.length} entries
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activities table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredActivities.length)} of {filteredActivities.length} entries
              </p>
            </div>
            <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ['activity-logs'] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 text-lg mb-2">No activity found</div>
              {hasActiveFilters && (
                <div className="text-sm text-gray-400">
                  Try adjusting your filters or search query
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedActivities.map((activity) => {
                    const actorBadge = getActorBadge(activity.actor)
                    const resultBadge = getResultBadge(activity.result)
                    const ResultIcon = resultBadge.icon
                    const ActorIcon = actorBadge.icon
                    
                    return (
                      <tr key={activity.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{formatDate(activity.timestamp)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={actorBadge.variant} size="sm" className="flex items-center gap-1 w-fit">
                            <ActorIcon className="h-3 w-3" />
                            {actorBadge.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{activity.action}</div>
                          {activity.details && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <span>{activity.details}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded font-mono">
                            {activity.resource}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={resultBadge.variant} size="sm" className="flex items-center gap-1 w-fit">
                            <ResultIcon className="h-3 w-3" />
                            {activity.result}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredActivities.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 font-medium">Items per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 7) {
                      pageNum = i + 1
                    } else if (currentPage <= 4) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i
                    } else {
                      pageNum = currentPage - 3 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info box */}
      {!logsData && activities.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Showing mock activity data. Backend endpoint <code className="bg-blue-100 px-1 rounded">/admin/logs</code> is not available or returned no data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

