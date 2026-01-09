import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { agreementsApi } from '../api/agreements'
import { formatDate } from '../lib/utils'

export default function Agreements() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OFFERED' | 'PENDING'>('ALL')

  const { data: agreements, isLoading, error } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => agreementsApi.listAgreements(),
  })

  const filteredAgreements = useMemo(() => {
    if (!agreements?.data) return []
    
    return agreements.data.filter((agreement) => {
      const matchesSearch = !searchQuery || 
        agreement.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agreement.agent?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agreement.source?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'ALL' || agreement.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [agreements?.data, searchQuery, statusFilter])

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agreements</h1>
          <p className="mt-2 text-gray-600">
            Manage agreements between agents and sources
          </p>
        </div>
        <ErrorDisplay error={error} title="Failed to load agreements" />
      </div>
    )
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
          <div className="flex items-center justify-between">
            <CardTitle>Agreements</CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <Input
                label="Search"
                placeholder="Search by reference, agent, or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Select
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'OFFERED', label: 'Offered' },
                  { value: 'PENDING', label: 'Pending' },
                ]}
              />
            </div>
          </div>
          {(searchQuery || statusFilter !== 'ALL') && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredAgreements.length} of {agreements?.data?.length || 0} agreements
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredAgreements.length > 0 ? (
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
                  {filteredAgreements.map((agreement) => (
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
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No agreements found</div>
              {(searchQuery || statusFilter !== 'ALL') && (
                <div className="text-sm text-gray-400">
                  Try adjusting your filters or search query
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
