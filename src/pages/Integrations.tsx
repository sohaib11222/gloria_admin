import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import { Input } from '../components/ui/Input'
import { Copy } from '../components/ui/Copy'
import { whitelistApi, WhitelistEntry } from '../api/whitelist'
import http from '../lib/http'
import toast from 'react-hot-toast'

type ApiKey = { 
  id: string
  name: string
  ownerType: 'agent' | 'source' | 'admin'
  ownerId: string
  status: 'active' | 'revoked'
  createdAt: string
  key?: string // Only present when first created
}

const apiKeysApi = {
  list: async (): Promise<ApiKey[]> => {
    const { data } = await http.get('/admin/api-keys')
    return (data.items || []).map((item: any) => ({
      ...item,
      createdAt: item.createdAt || new Date().toISOString(),
    }))
  },
  create: async (name?: string): Promise<ApiKey> => {
    const { data } = await http.post('/admin/api-keys', { 
      name: name || 'API Key',
      owner_type: 'admin',
      owner_id: 'default',
    })
    return {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
    }
  },
  revoke: async (id: string): Promise<void> => {
    await http.delete(`/admin/api-keys/${id}`)
  },
}

export default function Integrations() {
  const queryClient = useQueryClient()
  const [newIp, setNewIp] = useState('')
  const [ipType, setIpType] = useState<'agent' | 'source' | 'admin'>('admin')
  const [keyName, setKeyName] = useState('')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null)

  const { data: apiKeys, isLoading: keysLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeysApi.list(),
  })

  const { data: whitelist, isLoading: wlLoading } = useQuery({
    queryKey: ['whitelist'],
    queryFn: () => whitelistApi.listWhitelist(),
  })

  const createKey = useMutation({
    mutationFn: () => apiKeysApi.create(keyName || undefined),
    onSuccess: (data) => {
      setNewlyCreatedKey(data)
      setKeyName('')
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API key created successfully! Copy it now - it won\'t be shown again.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create API key')
    },
  })

  const revokeKey = useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API key revoked successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to revoke API key'
      toast.error(errorMessage)
      console.error('Failed to revoke API key:', error)
    },
  })

  const addIp = useMutation({
    mutationFn: () => {
      const ip = newIp.trim()
      if (!ip) {
        throw new Error('IP address or domain is required')
      }
      return whitelistApi.addWhitelistEntry({
        ip,
        type: ipType,
        enabled: true,
      })
    },
    onSuccess: () => {
      setNewIp('')
      queryClient.invalidateQueries({ queryKey: ['whitelist'] })
      toast.success('IP address added to whitelist')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add IP address'
      toast.error(errorMessage)
      console.error('Failed to add IP address:', error)
    },
  })

  const removeIp = useMutation({
    mutationFn: (entryId: string) => whitelistApi.removeWhitelistEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] })
      toast.success('IP address removed from whitelist')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove IP address'
      toast.error(errorMessage)
      console.error('Failed to remove IP address:', error)
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-2 text-gray-600">Manage API Keys and IP Whitelist</p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> IP whitelisting is global and organized by type (admin/agent/source). 
          API keys are shown only once when created - make sure to copy them immediately.
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
                {/* Newly created key display */}
                {newlyCreatedKey?.key && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-900 mb-2">⚠️ New API Key Created</p>
                    <p className="text-xs text-green-700 mb-3">Copy this key now - it won't be shown again!</p>
                    <div className="flex items-center gap-2 bg-white rounded px-3 py-2 border border-green-300">
                      <code className="text-sm font-mono flex-1">{newlyCreatedKey.key}</code>
                      <Copy text={newlyCreatedKey.key} label="Copy" />
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => setNewlyCreatedKey(null)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="text-sm text-gray-700">Name (optional)</label>
                    <Input
                      value={keyName}
                      onChange={(e) => setKeyName((e.target as any).value)}
                      placeholder="e.g. CI, Production, Local Dev"
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={() => createKey.mutate()} 
                    loading={createKey.isPending}
                    disabled={createKey.isPending}
                  >
                    Create Key
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(apiKeys || []).map((k) => (
                        <tr key={k.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{k.name || 'Unnamed'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{k.ownerType}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              k.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {k.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(k.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {k.status === 'active' && (
                              <Button 
                                variant="danger" 
                                size="sm" 
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
                                    revokeKey.mutate(k.id)
                                  }
                                }} 
                                loading={revokeKey.isPending}
                                disabled={revokeKey.isPending}
                              >
                                Revoke
                              </Button>
                            )}
                            {k.status === 'revoked' && (
                              <span className="text-xs text-gray-400">Revoked</span>
                            )}
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
            <p className="text-sm text-gray-500 mt-1">Manage global IP whitelist entries by type</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-sm text-gray-700">Type</label>
                  <select
                    value={ipType}
                    onChange={(e) => setIpType(e.target.value as 'agent' | 'source' | 'admin')}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                    <option value="source">Source</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-sm text-gray-700">IP Address or Domain</label>
                  <Input
                    value={newIp}
                    onChange={(e) => setNewIp((e.target as any).value)}
                    placeholder="192.168.1.1 or example.com"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <Button 
                    onClick={() => {
                      if (!newIp.trim()) {
                        toast.error('Please enter an IP address or domain')
                        return
                      }
                      addIp.mutate()
                    }} 
                    disabled={!newIp.trim() || addIp.isPending} 
                    loading={addIp.isPending} 
                    className="w-full"
                  >
                    Add
                  </Button>
                </div>
              </div>
              {wlLoading ? (
                <Loader className="min-h-32" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP/Domain</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(whitelist || []).map((w: WhitelistEntry) => (
                        <tr key={w.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{w.ip}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{w.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              w.enabled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {w.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(w.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Button 
                              variant="danger" 
                              size="sm" 
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove ${w.ip} from the whitelist?`)) {
                                  removeIp.mutate(w.id)
                                }
                              }} 
                              loading={removeIp.isPending}
                              disabled={removeIp.isPending}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(whitelist || []).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No whitelist entries yet. Add IP addresses or domains above.
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


