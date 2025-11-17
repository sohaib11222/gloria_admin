import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Loader } from '../components/ui/Loader'
import { companyWhitelistApi } from '../api/whitelist'
import toast from 'react-hot-toast'
import { Shield, Save, Plus, X } from 'lucide-react'

export default function Settings() {
  const [newDomain, setNewDomain] = useState('')
  const queryClient = useQueryClient()

  const { data: whitelistedDomains = [], isLoading } = useQuery({
    queryKey: ['companyWhitelist'],
    queryFn: () => companyWhitelistApi.getCompanyWhitelist(),
  })

  const updateMutation = useMutation({
    mutationFn: (domains: string[]) => companyWhitelistApi.updateCompanyWhitelist(domains),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyWhitelist'] })
      toast.success('Company whitelist updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update company whitelist')
    },
  })

  const handleAddDomain = () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain or IP address')
      return
    }
    const updated = [...whitelistedDomains, newDomain.trim()]
    updateMutation.mutate(updated)
    setNewDomain('')
  }

  const handleRemoveDomain = (domain: string) => {
    const updated = whitelistedDomains.filter((d) => d !== domain)
    updateMutation.mutate(updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          System configuration and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Health Monitor</p>
                  <p className="text-sm text-gray-600">Enable automatic health monitoring</p>
                </div>
                <Badge variant="success">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">OTA Mapper</p>
                  <p className="text-sm text-gray-600">Enable OTA data mapping</p>
                </div>
                <Badge variant="success">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">API Base URL</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {import.meta.env.VITE_MIDDLEWARE_URL || 'http://localhost:8080'}
                </code>
              </div>
              <div>
                <p className="font-medium">Version</p>
                <p className="text-sm text-gray-600">v1.0.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Whitelist (Domains) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Company Whitelist (Domains)</CardTitle>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Manage domains and IPs that are allowed to access your company's endpoints. 
            Used for branch import and other company-specific operations.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="localhost, 127.0.0.1, *.example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddDomain()
                    }
                  }}
                />
                <Button onClick={handleAddDomain} loading={updateMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Supports IP addresses (192.168.1.1), hostnames (localhost), and wildcards (*.example.com)
              </p>

              {whitelistedDomains.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Whitelisted Domains:</p>
                  <div className="flex flex-wrap gap-2">
                    {whitelistedDomains.map((domain, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm font-mono text-blue-900">{domain}</span>
                        <button
                          onClick={() => handleRemoveDomain(domain)}
                          className="text-blue-600 hover:text-blue-800"
                          disabled={updateMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No domains whitelisted</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add domains above to restrict access to your company endpoints
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Company whitelist is used when importing branches from supplier endpoints. 
                  The source's HTTP endpoint must be whitelisted for branch import to work.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
