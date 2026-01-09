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
import { Search, X, BarChart3, RefreshCw, Activity, TrendingUp, Clock, Zap, AlertCircle } from 'lucide-react'

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
      <div className="space-y-8 pb-8">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                System Metrics
              </h1>
              <p className="mt-2 text-gray-700 text-lg">
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
      <div className="space-y-8 pb-8">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                System Metrics
              </h1>
              <p className="mt-2 text-gray-700 text-lg">
                Real-time performance monitoring and analytics
              </p>
            </div>
          </div>
        </div>
        <Card className="bg-gradient-to-br from-white to-red-50/30 border-red-200 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <p className="text-red-600 font-semibold text-lg">Failed to load metrics</p>
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
    <div className="space-y-8 pb-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                System Metrics
              </h1>
              <p className="mt-2 text-gray-700 text-lg">
                Real-time performance monitoring and analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-2 border border-gray-200 shadow-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 mr-2">Refresh:</span>
            <div className="flex gap-2">
              <Button
                variant={refreshInterval === METRICS_REFRESH_INTERVALS.FAST ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setRefreshInterval(METRICS_REFRESH_INTERVALS.FAST)}
                className={refreshInterval === METRICS_REFRESH_INTERVALS.FAST ? 'shadow-md' : ''}
              >
                5s
              </Button>
              <Button
                variant={refreshInterval === METRICS_REFRESH_INTERVALS.NORMAL ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setRefreshInterval(METRICS_REFRESH_INTERVALS.NORMAL)}
                className={refreshInterval === METRICS_REFRESH_INTERVALS.NORMAL ? 'shadow-md' : ''}
              >
                10s
              </Button>
              <Button
                variant={refreshInterval === METRICS_REFRESH_INTERVALS.SLOW ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setRefreshInterval(METRICS_REFRESH_INTERVALS.SLOW)}
                className={refreshInterval === METRICS_REFRESH_INTERVALS.SLOW ? 'shadow-md' : ''}
              >
                30s
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Adapter Latency</CardTitle>
                <p className="text-xs text-gray-600 mt-0.5">Response time for adapter operations</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {latencySeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={latencySeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Seconds', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: any) => [`${Number(value).toFixed(4)}s`, 'Latency']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No latency data available</p>
                <p className="text-xs text-gray-400 mt-1">Data will appear here once metrics are collected</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-emerald-50/30 border-emerald-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">HTTP Request Duration</CardTitle>
                <p className="text-xs text-gray-600 mt-0.5">Time taken for HTTP requests to complete</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {httpDurationSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={httpDurationSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Seconds', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: any) => [`${Number(value).toFixed(4)}s`, 'Duration']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No HTTP duration data available</p>
                <p className="text-xs text-gray-400 mt-1">Data will appear here once metrics are collected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Metrics Display */}
      <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Available Metrics</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold text-gray-900">{availableMetrics.length}</span> metric{availableMetrics.length !== 1 ? 's' : ''} available
                  {searchQuery && (
                    <span className="text-gray-500"> (filtered from {metrics.length})</span>
                  )}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search metrics by name, type, or description..."
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {availableMetrics.length > 0 ? (
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
                    <div key={prefix} className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50/50 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                          <Activity className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                          {prefix}
                        </h3>
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
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
                              counter: 'from-purple-100 to-purple-200 text-purple-800 border-purple-300',
                              gauge: 'from-blue-100 to-blue-200 text-blue-800 border-blue-300',
                              histogram: 'from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300',
                              summary: 'from-amber-100 to-amber-200 text-amber-800 border-amber-300',
                            }
                            const typeColor = typeColors[metric.type] || 'from-gray-100 to-gray-200 text-gray-800 border-gray-300'
                            return (
                              <div 
                                key={metric.name} 
                                className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all group"
                              >
                                <div className="font-mono text-xs font-bold text-gray-900 break-all mb-3 group-hover:text-blue-600 transition-colors">
                                  {metric.name}
                                </div>
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gradient-to-r ${typeColor} border`}>
                                    {metric.type}
                                  </span>
                                  <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                                    {sampleCount} sample{sampleCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                {latestValue !== undefined && (
                                  <div className="mt-3 p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded border border-gray-200">
                                    <div className="text-xs text-gray-600 font-medium mb-1">Latest Value</div>
                                    <div className="text-sm text-gray-900 font-mono font-bold">
                                      {typeof latestValue === 'number' ? latestValue.toFixed(4) : String(latestValue)}
                                    </div>
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
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No metrics found</p>
              <p className="text-sm text-gray-500 mt-1">
                No metrics match "<span className="font-semibold">{searchQuery}</span>". Try a different search term.
              </p>
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No metrics available</p>
              <p className="text-sm text-gray-500 mt-1">Make sure the metrics endpoint is working correctly.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
