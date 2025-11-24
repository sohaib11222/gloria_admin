import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import { Input } from '../components/ui/Input'
import { metricsApi } from '../api/metrics'
import { parsePrometheusText, getMetricSeries } from '../lib/metrics'
import { METRICS_REFRESH_INTERVALS } from '../lib/constants'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Search, X } from 'lucide-react'

export default function Metrics() {
  const [refreshInterval, setRefreshInterval] = useState<number>(METRICS_REFRESH_INTERVALS.NORMAL)
  const [searchQuery, setSearchQuery] = useState('')

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
  
  // Filter metrics based on search query
  const filteredMetrics = useMemo(() => {
    if (!searchQuery.trim()) return metrics
    const query = searchQuery.toLowerCase()
    return metrics.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.help?.toLowerCase().includes(query) ||
      m.type.toLowerCase().includes(query)
    )
  }, [metrics, searchQuery])
  
  // Get all available metrics for display
  const availableMetrics = useMemo(() => {
    return filteredMetrics.map(m => m.name)
  }, [filteredMetrics])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metrics</h1>
          <p className="mt-2 text-gray-600">
            System performance metrics and monitoring
          </p>
        </div>
        <Loader className="min-h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metrics</h1>
          <p className="mt-2 text-gray-600">
            System performance metrics and monitoring
          </p>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600 font-medium">Failed to load metrics</p>
            <p className="text-sm text-gray-500 mt-2">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metrics</h1>
          <p className="mt-2 text-gray-600">
            System performance metrics and monitoring
          </p>
        </div>
        <div className="flex space-x-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Adapter Latency</CardTitle>
          </CardHeader>
          <CardContent>
            {latencySeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={latencySeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value) => [`${value}s`, 'Latency']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No latency data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HTTP Request Duration</CardTitle>
          </CardHeader>
          <CardContent>
            {httpDurationSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={httpDurationSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value) => [`${value}s`, 'Duration']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No HTTP duration data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Metrics Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Metrics</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {availableMetrics.length} metric{availableMetrics.length !== 1 ? 's' : ''} available
                {searchQuery && ` (filtered from ${metrics.length})`}
              </p>
            </div>
            <div className="w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search metrics..."
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {availableMetrics.length > 0 ? (
            <div className="space-y-4">
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
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                        {prefix} ({groupMetrics.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groupMetrics
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((metric) => {
                            const sampleCount = metric.samples.length
                            const latestValue = metric.samples[metric.samples.length - 1]?.value
                            return (
                              <div 
                                key={metric.name} 
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                              >
                                <div className="font-mono text-xs font-medium text-gray-900 break-all">
                                  {metric.name}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {metric.type}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {sampleCount} sample{sampleCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                {latestValue !== undefined && (
                                  <div className="mt-2 text-xs text-gray-600 font-mono">
                                    Latest: {typeof latestValue === 'number' ? latestValue.toFixed(4) : String(latestValue)}
                                  </div>
                                )}
                                {metric.help && (
                                  <div className="text-xs text-gray-400 mt-2 line-clamp-2">
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
            <div className="text-center py-8 text-gray-500">
              No metrics found matching "{searchQuery}". Try a different search term.
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No metrics available. Make sure the metrics endpoint is working.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
