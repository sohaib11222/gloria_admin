import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { metricsApi } from '../api/metrics'
import { parsePrometheusText, getMetricSeries } from '../lib/metrics'
import { METRICS_REFRESH_INTERVALS } from '../lib/constants'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Search, X, BarChart3, RefreshCw, Activity, TrendingUp, Zap, AlertCircle, Database, Gauge, Timer } from 'lucide-react'

export default function Metrics() {
  const [refreshInterval, setRefreshInterval] = useState<number>(METRICS_REFRESH_INTERVALS.NORMAL)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data: metricsText, isLoading, error, refetch } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => metricsApi.fetchMetrics(),
    refetchInterval: refreshInterval,
    retry: 2,
  })

  // Parse metrics - must be done before early returns to maintain hook order
  const metrics = useMemo(() => {
    return metricsText ? parsePrometheusText(metricsText) : []
  }, [metricsText])

  const latencySeries = useMemo(() => {
    return getMetricSeries(metrics, 'adapter_latency_seconds')
  }, [metrics])

  const httpDurationSeries = useMemo(() => {
    return getMetricSeries(metrics, 'http_request_duration_seconds')
  }, [metrics])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalMetrics = metrics.length
    const byType = metrics.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalSamples = metrics.reduce((sum, m) => sum + m.samples.length, 0)
    const metricsWithData = metrics.filter(m => m.samples.length > 0).length

    // Calculate average latency if available
    const avgLatency = latencySeries.length > 0
      ? latencySeries.reduce((sum, s) => sum + s.value, 0) / latencySeries.length
      : null

    // Calculate average HTTP duration if available
    const avgHttpDuration = httpDurationSeries.length > 0
      ? httpDurationSeries.reduce((sum, s) => sum + s.value, 0) / httpDurationSeries.length
      : null

    return {
      totalMetrics,
      byType,
      totalSamples,
      metricsWithData,
      avgLatency,
      avgHttpDuration,
    }
  }, [metrics, latencySeries, httpDurationSeries])
  
  // Filter metrics based on search query and type
  const filteredMetrics = useMemo(() => {
    let filtered = metrics

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter)
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.help?.toLowerCase().includes(query) ||
        m.type.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [metrics, searchQuery, typeFilter])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded">
              <BarChart3 className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                System Metrics
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Real-time performance monitoring and analytics
              </p>
            </div>
          </div>
        </div>
        <Loader className="min-h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded">
              <BarChart3 className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                System Metrics
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Real-time performance monitoring and analytics
              </p>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-red-600 font-semibold">Failed to load metrics</p>
                <p className="text-sm text-gray-600 mt-2 max-w-md">
                  {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
              </div>
              <Button onClick={() => refetch()} className="mt-2 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded">
              <BarChart3 className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                System Metrics
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Real-time performance monitoring and analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Refresh:</span>
            <Button
              variant={refreshInterval === METRICS_REFRESH_INTERVALS.FAST ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setRefreshInterval(METRICS_REFRESH_INTERVALS.FAST)}
            >
              5s
            </Button>
            <Button
              variant={refreshInterval === METRICS_REFRESH_INTERVALS.NORMAL ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setRefreshInterval(METRICS_REFRESH_INTERVALS.NORMAL)}
            >
              10s
            </Button>
            <Button
              variant={refreshInterval === METRICS_REFRESH_INTERVALS.SLOW ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setRefreshInterval(METRICS_REFRESH_INTERVALS.SLOW)}
            >
              30s
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Metrics</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalMetrics}</p>
                <p className="text-xs text-gray-600 mt-1">{summaryStats.metricsWithData} with data</p>
              </div>
              <div className="p-3 bg-blue-100 rounded">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Samples</p>
                <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalSamples.toLocaleString()}</p>
                <p className="text-xs text-gray-600 mt-1">Data points collected</p>
              </div>
              <div className="p-3 bg-green-100 rounded">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Avg Latency</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summaryStats.avgLatency !== null ? `${(summaryStats.avgLatency * 1000).toFixed(2)}ms` : 'N/A'}
                </p>
                <p className="text-xs text-gray-600 mt-1">Adapter operations</p>
              </div>
              <div className="p-3 bg-purple-100 rounded">
                <Timer className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Avg HTTP Duration</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summaryStats.avgHttpDuration !== null ? `${(summaryStats.avgHttpDuration * 1000).toFixed(2)}ms` : 'N/A'}
                </p>
                <p className="text-xs text-gray-600 mt-1">Request processing</p>
              </div>
              <div className="p-3 bg-orange-100 rounded">
                <Gauge className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded">
                <Activity className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Adapter Latency</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Response time for adapter operations</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {latencySeries.length > 0 ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {latencySeries.length} data point{latencySeries.length !== 1 ? 's' : ''}
                    </p>
                    {summaryStats.avgLatency !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Average: {(summaryStats.avgLatency * 1000).toFixed(2)}ms
                      </p>
                    )}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={latencySeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                      tickFormatter={(value) => `${(value * 1000).toFixed(0)}ms`}
                      label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#6b7280' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        padding: '8px 12px'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: any) => [`${(Number(value) * 1000).toFixed(2)}ms`, 'Latency']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No latency data available</p>
                <p className="text-xs text-gray-400 mt-1">Data will appear here once metrics are collected</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded">
                <TrendingUp className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">HTTP Request Duration</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Time taken for HTTP requests to complete</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {httpDurationSeries.length > 0 ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {httpDurationSeries.length} data point{httpDurationSeries.length !== 1 ? 's' : ''}
                    </p>
                    {summaryStats.avgHttpDuration !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Average: {(summaryStats.avgHttpDuration * 1000).toFixed(2)}ms
                      </p>
                    )}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={httpDurationSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                      tickFormatter={(value) => `${(value * 1000).toFixed(0)}ms`}
                      label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#6b7280' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        padding: '8px 12px'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: any) => [`${(Number(value) * 1000).toFixed(2)}ms`, 'Duration']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No HTTP duration data available</p>
                <p className="text-xs text-gray-400 mt-1">Data will appear here once metrics are collected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Metrics Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded">
              <Zap className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Available Metrics</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold text-gray-900">{filteredMetrics.length}</span> metric{filteredMetrics.length !== 1 ? 's' : ''} 
                {searchQuery || typeFilter !== 'all' ? (
                  <span className="text-gray-500"> (filtered from {metrics.length})</span>
                ) : (
                  <span> available</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search metrics by name or description..."
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select
                label=""
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'counter', label: 'Counter' },
                  { value: 'gauge', label: 'Gauge' },
                  { value: 'histogram', label: 'Histogram' },
                  { value: 'summary', label: 'Summary' },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredMetrics.length > 0 ? (
            <div className="space-y-6">
              {/* Group metrics by prefix for better organization */}
              {(() => {
                const grouped: Record<string, typeof filteredMetrics> = {}
                filteredMetrics.forEach(metric => {
                  const prefix = metric.name.split('_')[0] || 'other'
                  if (!grouped[prefix]) {
                    grouped[prefix] = []
                  }
                  grouped[prefix].push(metric)
                })
                
                return Object.entries(grouped)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([prefix, groupMetrics]) => (
                    <div key={prefix} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-gray-100 rounded">
                          <Activity className="h-4 w-4 text-gray-700" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          {prefix}
                        </h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {groupMetrics.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupMetrics
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((metric) => {
                            const sampleCount = metric.samples.length
                            const latestValue = metric.samples[metric.samples.length - 1]?.value
                            const typeColors: Record<string, string> = {
                              counter: 'bg-purple-100 text-purple-800 border-purple-300',
                              gauge: 'bg-blue-100 text-blue-800 border-blue-300',
                              histogram: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                              summary: 'bg-amber-100 text-amber-800 border-amber-300',
                            }
                            const typeColor = typeColors[metric.type] || 'bg-gray-100 text-gray-800 border-gray-300'
                            return (
                              <div 
                                key={metric.name} 
                                className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                              >
                                <div className="font-mono text-xs font-semibold text-gray-900 break-all mb-3">
                                  {metric.name}
                                </div>
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${typeColor} border`}>
                                    {metric.type}
                                  </span>
                                  <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                                    {sampleCount} sample{sampleCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                {latestValue !== undefined && (
                                  <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                                    <div className="text-xs text-gray-600 font-medium mb-1">Current Value</div>
                                    <div className="text-sm text-gray-900 font-mono font-semibold">
                                      {typeof latestValue === 'number' 
                                        ? latestValue >= 1 
                                          ? latestValue.toFixed(2) 
                                          : latestValue >= 0.001 
                                            ? latestValue.toFixed(4) 
                                            : latestValue.toExponential(2)
                                        : String(latestValue)}
                                    </div>
                                  </div>
                                )}
                                {sampleCount > 1 && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    {sampleCount} measurement{sampleCount !== 1 ? 's' : ''}
                                  </div>
                                )}
                                {metric.help && (
                                  <div className="mt-3 text-xs text-gray-600 leading-relaxed line-clamp-2 italic">
                                    {metric.help}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  ))
              })()}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-12">
              <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No metrics found</p>
              <p className="text-xs text-gray-500 mt-1">
                No metrics match "<span className="font-semibold">{searchQuery}</span>". Try a different search term.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No metrics available</p>
              <p className="text-xs text-gray-500 mt-1">Make sure the metrics endpoint is working correctly.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
