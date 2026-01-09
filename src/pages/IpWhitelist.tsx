import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Shield, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { Loader } from '../components/ui/Loader'
import { whitelistApi, WhitelistEntry } from '../api/whitelist'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'
import { z } from 'zod'

const WhitelistIPSchema = z.string().min(1, 'IP address is required')

export default function IpWhitelist() {
  const [newIp, setNewIp] = useState('')
  const [ipType, setIpType] = useState<'agent' | 'source' | 'admin'>('source')
  const [ipError, setIpError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'agent' | 'source' | 'admin'>('ALL')
  const queryClient = useQueryClient()

  const { data: whitelist, isLoading, error, refetch } = useQuery({
    queryKey: ['whitelist'],
    queryFn: () => whitelistApi.listWhitelist(),
  })

  const filteredWhitelist = React.useMemo(() => {
    if (!whitelist) return []
    return whitelist.filter((entry) => {
      const matchesSearch = !searchQuery || 
        entry.ip?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = typeFilter === 'ALL' || entry.type === typeFilter
      
      return matchesSearch && matchesType
    })
  }, [whitelist, searchQuery, typeFilter])

  const addMutation = useMutation({
    mutationFn: (data: { ip: string; type: 'agent' | 'source' | 'admin'; enabled?: boolean }) =>
      whitelistApi.addWhitelistEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] })
      setNewIp('')
      setIpError('')
      toast.success('IP address added to whitelist')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add IP to whitelist')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (entryId: string) => whitelistApi.removeWhitelistEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] })
      toast.success('IP address removed from whitelist')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove IP from whitelist')
    },
  })

  const handleAddIp = () => {
    try {
      WhitelistIPSchema.parse(newIp)
      setIpError('')
      addMutation.mutate({
        ip: newIp,
        type: ipType,
        enabled: true,
      })
    } catch (error: any) {
      setIpError(error.errors?.[0]?.message || 'Invalid IP address')
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'admin':
        return 'danger'
      case 'source':
        return 'info'
      case 'agent':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">IP Whitelist Management</h1>
        <p className="mt-2 text-gray-600">
          Manage IP addresses and domains that are allowed to access the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add IP Address or Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="192.168.1.1, localhost, or *.example.com"
                value={newIp}
                onChange={(e) => {
                  setNewIp(e.target.value)
                  if (ipError) setIpError('')
                }}
                error={ipError}
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddIp()
                  }
                }}
              />
              <select
                value={ipType}
                onChange={(e) => setIpType(e.target.value as 'agent' | 'source' | 'admin')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="source">Source</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
              <Button onClick={handleAddIp} loading={addMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Supports IP addresses (192.168.1.1), hostnames (localhost), and wildcards (*.example.com)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Whitelisted IPs and Domains</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {filteredWhitelist.length} of {whitelist?.length || 0} entry(s) shown
              </p>
            </div>
            <Button variant="secondary" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <Input
                label="Search"
                placeholder="Search by IP or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Select
                label="Filter by Type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                options={[
                  { value: 'ALL', label: 'All Types' },
                  { value: 'source', label: 'Source' },
                  { value: 'agent', label: 'Agent' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : error ? (
            <ErrorDisplay error={error} title="Failed to load whitelist" />
          ) : filteredWhitelist.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No IPs found</p>
              {(searchQuery || typeFilter !== 'ALL') ? (
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your filters
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-1">
                  Add IP addresses or domains above to get started
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP/Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWhitelist.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900">{entry.ip}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getTypeBadgeVariant(entry.type)} size="sm">
                          {entry.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={entry.enabled ? 'success' : 'warning'} size="sm">
                          {entry.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${entry.ip} from the whitelist?`)) {
                              removeMutation.mutate(entry.id)
                            }
                          }}
                          loading={removeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About IP Whitelisting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>IP Whitelisting</strong> allows you to restrict access to the middleware API based on IP addresses or domains.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>IP addresses: <code className="bg-gray-100 px-1 rounded">192.168.1.1</code></li>
              <li>Hostnames: <code className="bg-gray-100 px-1 rounded">localhost</code></li>
              <li>Wildcards: <code className="bg-gray-100 px-1 rounded">*.example.com</code></li>
            </ul>
            <p>
              <strong>Type</strong> determines which role the whitelist entry applies to (Source, Agent, or Admin).
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Note: Whitelist enforcement is optional and can be disabled via environment variables.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

