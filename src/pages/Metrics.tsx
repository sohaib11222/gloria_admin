import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import { metricsApi } from '../api/metrics'
import { parsePrometheusText, getMetricSeries } from '../lib/metrics'
import { METRICS_REFRESH_INTERVALS } from '../lib/constants'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Metrics() {
  const [refreshInterval, setRefreshInterval] = useState(METRICS_REFRESH_INTERVALS.NORMAL)

  const { data: metricsText, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => metricsApi.fetchMetrics(),
    refetchInterval: refreshInterval,
  })

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

  const metrics = metricsText ? parsePrometheusText(metricsText) : []
  const latencySeries = getMetricSeries(metrics, 'adapter_latency_seconds')
  const httpDurationSeries = getMetricSeries(metrics, 'http_request_duration_seconds')

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
    </div>
  )
}
