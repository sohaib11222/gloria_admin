import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { Input } from '../components/ui/Input'
import { logsApi } from '../api/logs'
import http from '../lib/http'
import { formatDate } from '../lib/utils'
import { Filter } from 'lucide-react'

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
  const [selectedType, setSelectedType] = useState<ActivityType>('all')
  const [selectedActor, setSelectedActor] = useState<ActivityActor | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  const getActorBadge = (actor: ActivityActor) => {
    const badges = {
      agent: { variant: 'info' as const, label: 'Agent' },
      source: { variant: 'warning' as const, label: 'Source' },
      admin: { variant: 'default' as const, label: 'Admin' },
      system: { variant: 'default' as const, label: 'System' },
    }
    return badges[actor] || { variant: 'default' as const, label: actor }
  }

  const getResultBadge = (result: ActivityEntry['result']) => {
    const badges = {
      success: { variant: 'success' as const },
      error: { variant: 'danger' as const },
      warning: { variant: 'warning' as const },
    }
    return badges[result]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity & Audit Log</h1>
        <p className="mt-2 text-gray-600">
          View all system activity and audit events
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ActivityType)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="booking">Booking</option>
                <option value="availability">Availability</option>
                <option value="health">Health</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Actor:</span>
              <select
                value={selectedActor}
                onChange={(e) => setSelectedActor(e.target.value as ActivityActor | 'all')}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="agent">Agent</option>
                <option value="source">Source</option>
                <option value="admin">Admin</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Search actions or resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <p className="text-sm text-gray-500 mt-1">{filteredActivities.length} entries</p>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No activity found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredActivities.map((activity) => {
                    const actorBadge = getActorBadge(activity.actor)
                    const resultBadge = getResultBadge(activity.result)
                    
                    return (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(activity.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={actorBadge.variant} size="sm">
                            {actorBadge.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                          {activity.details && (
                            <div className="text-xs text-gray-500 mt-1">{activity.details}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-sm text-gray-600">{activity.resource}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={resultBadge.variant} size="sm">
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

