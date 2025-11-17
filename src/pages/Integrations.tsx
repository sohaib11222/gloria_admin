import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import { Select } from '../components/ui/Select'
import { Copy } from '../components/ui/Copy'
import { whitelistApi } from '../api/whitelist'
import http from '../lib/http'

type ApiKey = { id: string; key: string; createdAt: string; label?: string }

const apiKeysApi = {
  list: async (): Promise<ApiKey[]> => {
    const { data } = await http.get('/admin/api-keys')
    return data.items || []
  },
  create: async (label?: string): Promise<ApiKey> => {
    const { data } = await http.post('/admin/api-keys', { label })
    return data
  },
  revoke: async (id: string): Promise<void> => {
    await http.delete(`/admin/api-keys/${id}`)
  },
}

export default function Integrations() {
  const queryClient = useQueryClient()
  const [selectedCompany, setSelectedCompany] = useState('')
  const [newIp, setNewIp] = useState('')
  const [keyLabel, setKeyLabel] = useState('')

  const { data: apiKeys, isLoading: keysLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeysApi.list(),
  })

  const { data: whitelist, isLoading: wlLoading } = useQuery({
    queryKey: ['whitelist', selectedCompany],
    queryFn: () => selectedCompany ? whitelistApi.listWhitelist(selectedCompany) : Promise.resolve([]),
    enabled: !!selectedCompany,
  })

  const createKey = useMutation({
    mutationFn: () => apiKeysApi.create(keyLabel || undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  })

  const revokeKey = useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  })

  const addIp = useMutation({
    mutationFn: () => whitelistApi.addWhitelistEntry(selectedCompany, newIp),
    onSuccess: () => {
      setNewIp('')
      queryClient.invalidateQueries({ queryKey: ['whitelist', selectedCompany] })
    },
  })

  const removeIp = useMutation({
    mutationFn: (entry: any) => whitelistApi.removeWhitelistEntry(entry.id, entry.companyId, entry.ip),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whitelist', selectedCompany] }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-2 text-gray-600">Manage API Keys and IP Whitelist</p>
      </div>

      {/* Info banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> IP whitelisting enforcement is configured at the middleware layer. See spec for implementation details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {keysLoading ? (
              <Loader className="min-h-48" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="text-sm text-gray-700">Label (optional)</label>
                    <input value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm" placeholder="e.g. CI, local" />
                  </div>
                  <Button onClick={() => createKey.mutate()} loading={createKey.isPending}>Create Key</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(apiKeys || []).map((k) => (
                        <tr key={k.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono">{k.key}</code>
                              <Copy text={k.key} label="" className="p-1" />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{k.label || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(k.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Button variant="danger" size="sm" onClick={() => revokeKey.mutate(k.id)} loading={revokeKey.isPending}>Revoke</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(apiKeys || []).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No API keys yet. Create one to get started.
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IP Whitelist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-sm text-gray-700">Company ID</label>
                  <input value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm" placeholder="company id" />
                </div>
                <div className="col-span-1">
                  <label className="text-sm text-gray-700">IP</label>
                  <input value={newIp} onChange={(e) => setNewIp(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm" placeholder="0.0.0.0/32" />
                </div>
                <div className="col-span-1 flex items-end">
                  <Button onClick={() => addIp.mutate()} disabled={!selectedCompany || !newIp} loading={addIp.isPending} className="w-full">Add</Button>
                </div>
              </div>
              {wlLoading ? (
                <Loader className="min-h-32" />
              ) : selectedCompany ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(whitelist || []).map((w) => (
                        <tr key={`${w.id}-${w.ip}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{w.ip}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(w.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Button variant="danger" size="sm" onClick={() => removeIp.mutate(w)} loading={removeIp.isPending}>Remove</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Select a company to view whitelist entries</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


