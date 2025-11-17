import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { healthApi } from '../api/health'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

export default function Health() {
  const [showExcludedOnly, setShowExcludedOnly] = useState(false)
  const queryClient = useQueryClient()

  const { data: health, isLoading } = useQuery({
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

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

  const rowsAll = Array.isArray(health) ? health : (health?.items ?? [])
  const rows = showExcludedOnly ? rowsAll.filter((s: any) => s.status === 'EXCLUDED') : rowsAll

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="mt-2 text-gray-600">
            Monitor source health and manage backoff policies
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" checked={showExcludedOnly} onChange={(e) => setShowExcludedOnly(e.target.checked)} />
            <span>Show only excluded</span>
          </label>
          <Button
            onClick={() => resetHealthMutation.mutate()}
            loading={resetHealthMutation.isPending}
            variant="secondary"
          >
            Reset All Health
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Source Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slow Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sample Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Backoff Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Excluded Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((source) => (
                  <tr key={source.companyId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {source.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          source.status === 'HEALTHY' ? 'success' : 
                          source.status === 'SLOW' ? 'warning' : 'danger'
                        }
                      >
                        {source.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(source.slowRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {source.sampleCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {source.backoffLevel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {source.excludedUntil ? formatDate(source.excludedUntil) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resetHealthMutation.mutate(source.companyId)}
                        loading={resetHealthMutation.isPending}
                      >
                        Reset
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
