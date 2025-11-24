import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Loader } from '../components/ui/Loader'
import { locationsApi } from '../api/locations'
import { agreementsApi } from '../api/agreements'

export default function Locations() {
  const [tab, setTab] = useState<'all' | 'byAgreement' | 'bySource'>('all')
  const [agreementId, setAgreementId] = useState<string>('')

  const { data: agreements } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => agreementsApi.listAgreements(),
  })

  const { data: allLocations, isLoading: allLoading } = useQuery({
    queryKey: ['locations', 'all'],
    queryFn: () => locationsApi.getAllLocations({ limit: 50 }),
  })

  const { data: byAgreementLocations, isLoading: byAgreementLoading } = useQuery({
    queryKey: ['locations', 'agreement', agreementId],
    queryFn: () => agreementId ? locationsApi.getAgreementLocations(agreementId) : Promise.resolve({ items: [], inherited: false }),
    enabled: tab === 'byAgreement',
  })

  const { data: sourceCounts, isLoading: bySourceLoading } = useQuery({
    queryKey: ['locations', 'by-source'],
    queryFn: () => locationsApi.listSourcesLocationCounts(),
    enabled: tab === 'bySource',
  })

  const isLoading = tab === 'all' ? allLoading : tab === 'byAgreement' ? byAgreementLoading : bySourceLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
        <p className="mt-2 text-gray-600">
          Manage supported locations and UN/LOCODE data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-3">
            <Button variant={tab === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('all')}>All LOCODE</Button>
            <Button variant={tab === 'byAgreement' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('byAgreement')}>By Agreement</Button>
            <Button variant={tab === 'bySource' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('bySource')}>By Source</Button>
            {tab === 'byAgreement' && (
              <div className="ml-4 w-72">
                <Select
                  label="Agreement"
                  value={agreementId}
                  onChange={(e) => setAgreementId(e.target.value)}
                  options={[{ value: '', label: 'Select agreement' }].concat(
                    (agreements?.data ?? []).map((a) => ({ value: a.id, label: `${a.agreementRef} (${a.status})` }))
                  )}
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <Loader className="min-h-48" />
          ) : (
            <>
              {tab === 'all' && (
                <div>
                  {((allLocations?.items ?? allLocations?.data ?? []).length === 0) ? (
                    <div className="text-center py-8 text-gray-500">No locations found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UN/LOCODE</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IATA Code</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(allLocations?.items ?? allLocations?.data ?? []).map((loc: any) => (
                            <tr key={loc.unlocode}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loc.unlocode}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loc.place || loc.name || '—'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loc.country}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.iata_code || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'byAgreement' && (
                <div>
                  {(byAgreementLocations?.inherited) && (
                    <div className="mb-3 text-xs inline-flex px-2 py-1 rounded-full bg-gray-100 text-gray-700">from global</div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UN/LOCODE</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(byAgreementLocations?.items ?? []).map((loc: any) => (
                          <tr key={loc.unlocode}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loc.unlocode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(byAgreementLocations?.items ?? []).length === 0 && (
                      <div className="text-center py-8 text-gray-500">No locations found</div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'bySource' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locations</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(sourceCounts?.items ?? []).map((s: any) => (
                        <tr key={s.sourceId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.companyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.status}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{s.locations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(sourceCounts?.items ?? []).length === 0 && (
                    <div className="text-center py-8 text-gray-500">No data</div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
