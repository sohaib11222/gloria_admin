import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Edit, 
  Play, 
  RefreshCw, 
  Shield, 
  MapPin, 
  Plus,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Loader } from '../components/ui/Loader'
import { companiesApi } from '../api/companies'
import { whitelistApi, branchImportApi } from '../api/whitelist'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EndpointSchema, WhitelistIPSchema } from '../lib/validators'
import toast from 'react-hot-toast'

interface EditSourceModalProps {
  source: any
  isOpen: boolean
  onClose: () => void
}

const EditSourceModal: React.FC<EditSourceModalProps> = ({ source, isOpen, onClose }) => {
  const queryClient = useQueryClient()
  const [isWhitelistOpen, setIsWhitelistOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(EndpointSchema),
    defaultValues: {
      api_base_url: source?.api_base_url || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => companiesApi.updateCompany(source.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast.success('Source updated successfully')
      onClose()
    },
  })

  const onSubmit = (data: any) => {
    updateMutation.mutate(data)
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Source" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="API Base URL"
            placeholder="https://api.example.com"
            error={errors.api_base_url?.message as string | undefined}
            {...register('api_base_url')}
          />

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={() => setIsWhitelistOpen(true)}
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            Manage IP Whitelist
          </Button>
        </div>
      </Modal>

      <WhitelistModal
        companyId={source?.id}
        isOpen={isWhitelistOpen}
        onClose={() => setIsWhitelistOpen(false)}
      />
    </>
  )
}

interface WhitelistModalProps {
  companyId: string
  isOpen: boolean
  onClose: () => void
}

const WhitelistModal: React.FC<WhitelistModalProps> = ({ companyId, isOpen, onClose }) => {
  const [newIp, setNewIp] = useState('')
  const [ipType, setIpType] = useState<'agent' | 'source' | 'admin'>('source')
  const [ipError, setIpError] = useState('')

  const { data: whitelist, isLoading, refetch } = useQuery({
    queryKey: ['whitelist'],
    queryFn: () => whitelistApi.listWhitelist(),
    enabled: isOpen,
  })

  // Filter whitelist by company type if companyId is provided
  const filteredWhitelist = whitelist?.filter(() => {
    // If companyId is provided, try to match by type (this is a simplified approach)
    // In a real scenario, you might want to link entries to companies
    return true // Show all entries for now
  })

  const addMutation = useMutation({
    mutationFn: (data: { ip: string; type: 'agent' | 'source' | 'admin'; enabled?: boolean }) =>
      whitelistApi.addWhitelistEntry(data),
    onSuccess: () => {
      refetch()
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
      refetch()
      toast.success('IP address removed from whitelist')
    },
  })

  const testMutation = useMutation({
    mutationFn: () => whitelistApi.testWhitelist(companyId),
    onSuccess: (results) => {
      const accessible = results.every(r => r.accessible)
      toast.success(accessible ? 'All IPs are accessible' : 'Some IPs are not accessible')
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="IP Whitelist Management" size="lg">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="192.168.1.1 or localhost"
              value={newIp}
              onChange={(e) => setNewIp((e.currentTarget as any).value)}
              error={ipError}
              className="flex-1"
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
              Add IP
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Add IP addresses or domains to whitelist. Supports wildcards like *.example.com
          </p>
        </div>

        <div className="flex justify-between items-center">
          <h4 className="font-medium">Current Whitelist</h4>
          {companyId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => testMutation.mutate()}
              loading={testMutation.isPending}
            >
              Test Access
            </Button>
          )}
        </div>

        {isLoading ? (
          <Loader />
        ) : (
          <div className="space-y-2">
            {filteredWhitelist && filteredWhitelist.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP/Domain</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWhitelist.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-2">
                          <span className="font-mono text-sm">{entry.ip}</span>
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant="info" size="sm">{entry.type}</Badge>
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={entry.enabled ? 'success' : 'warning'} size="sm">
                            {entry.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeMutation.mutate(entry.id)}
                            loading={removeMutation.isPending}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No IPs in whitelist</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function Sources() {
  const [editingSource, setEditingSource] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: sources, isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: () => companiesApi.listSources(),
  })

  const healthCheckMutation = useMutation({
    mutationFn: (companyId: string) => companiesApi.runHealthCheck(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast.success('Health check completed')
    },
  })

  const resetHealthMutation = useMutation({
    mutationFn: (companyId: string) => companiesApi.resetHealth(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast.success('Health reset completed')
    },
  })

  const syncLocationsMutation = useMutation({
    mutationFn: (companyId: string) => companiesApi.syncLocations(companyId),
    onSuccess: () => {
      toast.success('Location sync completed')
    },
  })

  const importBranchesMutation = useMutation({
    mutationFn: (sourceId: string) => branchImportApi.importBranches(sourceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast.success(
        `Branches imported successfully: ${data.imported} new, ${data.updated} updated, ${data.total} total`,
        { duration: 5000 }
      )
    },
    onError: (error: any) => {
      const errorData = error.response?.data
      const errorCode = errorData?.error
      const errorMessage = errorData?.message || 'Failed to import branches'
      
      // Handle specific error codes with helpful messages
      let userMessage = errorMessage
      if (errorCode === 'NOT_APPROVED') {
        userMessage = 'Source must be approved before importing branches. Please approve the source first.'
      } else if (errorCode === 'EMAIL_NOT_VERIFIED') {
        userMessage = 'Source email must be verified before importing branches.'
      } else if (errorCode === 'HTTP_ENDPOINT_NOT_CONFIGURED') {
        userMessage = 'Source HTTP endpoint must be configured before importing branches.'
      } else if (errorCode === 'COMPANY_CODE_MISSING') {
        userMessage = 'Source company code is missing. Please verify the source registration.'
      } else if (errorCode === 'WHITELIST_VIOLATION') {
        userMessage = 'Source endpoint is not whitelisted. Please add it to the IP whitelist first.'
      } else if (errorCode === 'VALIDATION_FAILED') {
        const errorCount = errorData?.errors?.length || 0
        userMessage = `${errorCount} branch(es) failed validation. Check the details below.`
        // Show validation errors in console for debugging
        if (errorData?.errors) {
          console.error('Branch validation errors:', errorData.errors)
        }
      } else if (errorCode === 'COMPANY_CODE_MISMATCH') {
        userMessage = `Company code mismatch: ${errorMessage}`
      } else if (errorCode === 'NO_BRANCHES') {
        userMessage = 'No branches found in supplier response. Check supplier endpoint configuration.'
      } else if (errorCode === 'TIMEOUT') {
        userMessage = 'Supplier endpoint timeout after 30s. Check network connectivity and endpoint availability.'
      } else if (errorCode === 'SUPPLIER_ERROR') {
        userMessage = `Supplier endpoint error: ${errorMessage}`
      }
      
      toast.error(userMessage, { duration: 6000 })
    },
  })

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sources</h1>
          <p className="mt-2 text-gray-600">
            Manage car rental source companies and their configurations
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Source Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch Import Ready
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sources?.data?.map((source) => {
                  // Check branch import prerequisites
                  const isApproved = source.approvalStatus === 'APPROVED'
                  const isEmailVerified = source.emailVerified === true
                  const hasHttpEndpoint = !!source.httpEndpoint
                  const hasCompanyCode = !!source.companyCode
                  const isActive = source.status === 'ACTIVE'
                  
                  const canImportBranches = isActive && isApproved && isEmailVerified && hasHttpEndpoint && hasCompanyCode
                  
                  const missingRequirements: string[] = []
                  if (!isActive) missingRequirements.push('ACTIVE status')
                  if (!isApproved) missingRequirements.push('APPROVED status')
                  if (!isEmailVerified) missingRequirements.push('Verified email')
                  if (!hasHttpEndpoint) missingRequirements.push('HTTP endpoint configured')
                  if (!hasCompanyCode) missingRequirements.push('Company code')
                  
                  return (
                    <tr key={source.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{source.companyName}</div>
                          <div className="text-sm text-gray-500">{source.email}</div>
                          {source.companyCode && (
                            <div className="text-xs text-gray-400 font-mono mt-1">
                              Code: {source.companyCode}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge variant={source.status === 'ACTIVE' ? 'success' : 'warning'}>
                            {source.status}
                          </Badge>
                          {source.approvalStatus && (
                            <div>
                              <Badge 
                                variant={source.approvalStatus === 'APPROVED' ? 'success' : source.approvalStatus === 'REJECTED' ? 'danger' : 'warning'}
                                size="sm"
                              >
                                {source.approvalStatus}
                              </Badge>
                            </div>
                          )}
                          {source.emailVerified !== undefined && (
                            <div>
                              <Badge variant={source.emailVerified ? 'success' : 'warning'} size="sm">
                                {source.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canImportBranches ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="success" size="sm">Ready</Badge>
                            <span className="text-xs text-gray-500">All prerequisites met</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Badge variant="warning" size="sm">Not Ready</Badge>
                            <div className="text-xs text-gray-500 max-w-xs">
                              Missing: {missingRequirements.join(', ')}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          {source.httpEndpoint ? (
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs block">
                              {source.httpEndpoint}
                            </code>
                          ) : (
                            <span className="text-gray-400 text-xs">HTTP: Not configured</span>
                          )}
                          {source.grpcEndpoint && (
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs block">
                              gRPC: {source.grpcEndpoint}
                            </code>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSource(source)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => healthCheckMutation.mutate(source.id)}
                            loading={healthCheckMutation.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetHealthMutation.mutate(source.id)}
                            loading={resetHealthMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => syncLocationsMutation.mutate(source.id)}
                            loading={syncLocationsMutation.isPending}
                            title="Sync Locations"
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (!canImportBranches) {
                                toast.error(`Cannot import branches. Missing: ${missingRequirements.join(', ')}`)
                                return
                              }
                              importBranchesMutation.mutate(source.id)
                            }}
                            loading={importBranchesMutation.isPending}
                            title={
                              canImportBranches
                                ? 'Import branches from supplier endpoint'
                                : `Cannot import branches. Missing: ${missingRequirements.join(', ')}`
                            }
                            disabled={!canImportBranches}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EditSourceModal
        source={editingSource}
        isOpen={!!editingSource}
        onClose={() => setEditingSource(null)}
      />
    </div>
  )
}
