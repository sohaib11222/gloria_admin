import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { healthApi } from '../api/health'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { 
  HeartPulse, 
  Search, 
  Filter, 
  RotateCcw, 
  TrendingUp, 
  Activity, 
  Shield, 
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react'

export default function Health() {
  const [showExcludedOnly, setShowExcludedOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HEALTHY' | 'SLOW' | 'EXCLUDED'>('ALL')
  const queryClient = useQueryClient()

  const { data: health, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.getSourceHealth(),
  })

  const resetHealthMutation = useMutation({
    mutationFn: (companyId?: string) => healthApi.resetHealth(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] })
      toast.success('Health reset completed')
    },
  })

  // Calculate rowsAll - must be before any conditional returns
  const rowsAll = React.useMemo(() => {
    if (isLoading || !health) return []
    return Array.isArray(health) ? health : (health?.items ?? [])
  }, [health, isLoading])
  
  // Filter rows - must be before any conditional returns
  const filteredRows = React.useMemo(() => {
    let filtered = rowsAll
    
    if (showExcludedOnly) {
      filtered = filtered.filter((s: any) => s.status === 'EXCLUDED')
    }
    
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((s: any) => s.status === statusFilter)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((s: any) => 
        s.companyName?.toLowerCase().includes(query) ||
        s.companyId?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [rowsAll, showExcludedOnly, statusFilter, searchQuery])
  
  // Calculate counts - must be before any conditional returns
  const healthyCount = React.useMemo(() => 
    rowsAll.filter((s: any) => s.status === 'HEALTHY').length,
    [rowsAll]
  )
  const slowCount = React.useMemo(() => 
    rowsAll.filter((s: any) => s.status === 'SLOW').length,
    [rowsAll]
  )
  const excludedCount = React.useMemo(() => 
    rowsAll.filter((s: any) => s.status === 'EXCLUDED').length,
    [rowsAll]
  )

  const rows = filteredRows

  // Now we can do conditional returns after all hooks
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader className="min-h-96" />
            <div className="absolute inset-0 flex items-center justify-center">
              <HeartPulse className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Loading health data...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch system health information</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded">
              <HeartPulse className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                System Health
              </h1>
              <p className="mt-1 text-sm text-gray-600">Monitor source health and manage backoff policies</p>
            </div>
          </div>
          <Button
            onClick={() => resetHealthMutation.mutate()}
            loading={resetHealthMutation.isPending}
            variant="secondary"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All Health
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Healthy Sources</p>
                <p className="text-3xl font-semibold text-gray-900 mb-2">
                  {healthyCount}
                </p>
                <Badge variant="success" size="sm" className="mt-2">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Operational
                </Badge>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <CheckCircle2 className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Slow Sources</p>
                <p className="text-3xl font-semibold text-gray-900 mb-2">
                  {slowCount}
                </p>
                <Badge variant="warning" size="sm" className="mt-2">
                  <Clock className="w-3 h-3 mr-1" />
                  Performance Issues
                </Badge>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <Activity className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Excluded Sources</p>
                <p className="text-3xl font-semibold text-gray-900 mb-2">
                  {excludedCount}
                </p>
                <Badge variant="danger" size="sm" className="mt-2">
                  <Shield className="w-3 h-3 mr-1" />
                  Temporarily Disabled
                </Badge>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <AlertCircle className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded">
                <BarChart3 className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Source Health Status</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Monitor and manage source performance metrics</p>
              </div>
            </div>
            {(searchQuery || statusFilter !== 'ALL' || showExcludedOnly) && (
              <div className="px-4 py-2 bg-white rounded border border-gray-200">
                <p className="text-sm font-semibold text-gray-700">
                  Showing <span className="text-blue-600">{rows.length}</span> of <span className="text-gray-900">{rowsAll.length}</span> sources
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Sources</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by company name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 sm:text-sm hover:border-gray-400"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'HEALTHY', label: 'Healthy' },
                    { value: 'SLOW', label: 'Slow' },
                    { value: 'EXCLUDED', label: 'Excluded' },
                  ]}
                />
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer px-4 py-2 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={showExcludedOnly} 
                  onChange={(e) => setShowExcludedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium">Show only excluded</span>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="text-center py-12 px-6">
              <div className="p-4 bg-red-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-semibold text-lg mb-2">Failed to load health data</p>
              <p className="text-gray-500 text-sm mb-4">Please try again or contact support if the issue persists</p>
              <Button 
                variant="primary" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['health'] })}
                className="flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-gray-500 text-lg font-semibold mb-2">No health data found</div>
              {(searchQuery || statusFilter !== 'ALL' || showExcludedOnly) && (
                <div className="text-sm text-gray-400">
                  Try adjusting your filters or search query
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Slow Rate
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Sample Count
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Backoff Level
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Excluded Until
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((source, index) => (
                  <tr 
                    key={source.companyId}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          source.status === 'HEALTHY' ? 'bg-green-500' :
                          source.status === 'SLOW' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{source.companyName}</div>
                          <div className="text-xs text-gray-500 font-mono">{source.companyId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          source.status === 'HEALTHY' ? 'success' : 
                          source.status === 'SLOW' ? 'warning' : 'danger'
                        }
                        className="font-semibold"
                      >
                        {source.status === 'HEALTHY' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {source.status === 'SLOW' && <Clock className="w-3 h-3 mr-1" />}
                        {source.status === 'EXCLUDED' && <Shield className="w-3 h-3 mr-1" />}
                        {source.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[60px]">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              source.slowRate > 0.3 ? 'bg-red-500' :
                              source.slowRate > 0.1 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(source.slowRate * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 min-w-[50px]">
                          {(source.slowRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">{source.sampleCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        source.backoffLevel === 0 ? 'bg-green-100 text-green-800' :
                        source.backoffLevel <= 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {source.backoffLevel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {source.excludedUntil ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{formatDate(source.excludedUntil)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resetHealthMutation.mutate(source.companyId)}
                        loading={resetHealthMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
