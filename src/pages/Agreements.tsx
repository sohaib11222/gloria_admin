import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { agreementsApi } from '../api/agreements'
import { formatDate } from '../lib/utils'

export default function Agreements() {
  const { data: agreements, isLoading } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => agreementsApi.listAgreements(),
  })

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agreements</h1>
        <p className="mt-2 text-gray-600">
          Manage agreements between agents and sources
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          {agreements?.data && agreements.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agreements.data.map((agreement) => (
                    <tr key={agreement.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agreement.reference}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agreement.agent?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agreement.source?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={agreement.status === 'ACTIVE' ? 'success' : 'warning'}>{agreement.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(agreement.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {agreement.status === 'OFFERED' && (
                            <Button size="sm" variant="secondary">Accept</Button>
                          )}
                          <Button size="sm" variant="secondary">Impersonate agent</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No agreements found</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
