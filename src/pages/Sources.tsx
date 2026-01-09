import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Edit, 
  Play, 
  RefreshCw, 
  Shield, 
  MapPin, 
  Plus,
  Download,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Server,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
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
        companyType={source?.type?.toLowerCase() || 'source'}
        isOpen={isWhitelistOpen}
        onClose={() => setIsWhitelistOpen(false)}
      />
    </>
  )
}

interface WhitelistModalProps {
  companyId: string
  companyType?: 'source' | 'agent' | 'admin'
  isOpen: boolean
  onClose: () => void
}

const WhitelistModal: React.FC<WhitelistModalProps> = ({ companyId, companyType = 'source', isOpen, onClose }) => {
  const [newIp, setNewIp] = useState('')
  const [ipType, setIpType] = useState<'agent' | 'source' | 'admin'>(companyType as 'agent' | 'source' | 'admin')
  const [ipError, setIpError] = useState('')

  const { data: whitelist, isLoading, refetch } = useQuery({
    queryKey: ['whitelist'],
    queryFn: () => whitelistApi.listWhitelist(),
    enabled: isOpen,
  })

  // Filter whitelist by company type
  const filteredWhitelist = whitelist?.filter((entry) => {
    // Show entries that match the company type or are admin entries
    return entry.type === ipType || entry.type === 'admin'
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
      if (!results || results.length === 0) {
        toast.error('No test results returned')
        return
      }
      const accessible = results.every(r => r.accessible)
      const failed = results.filter(r => !r.accessible)
      if (accessible) {
        toast.success(`All ${results.length} endpoint(s) are accessible`)
      } else {
        toast.error(`${failed.length} of ${results.length} endpoint(s) are not accessible. Check whitelist configuration.`)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to test whitelist access')
    },
  })

  const handleAddIp = () => {
    const trimmedIp = newIp.trim()
    if (!trimmedIp) {
      setIpError('IP address or domain is required')
      return
    }
    
    try {
      WhitelistIPSchema.parse(trimmedIp)
      setIpError('')
      addMutation.mutate({
        ip: trimmedIp,
        type: ipType,
        enabled: true,
      })
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        setIpError(error.errors[0].message)
      } else if (error.message) {
        setIpError(error.message)
      } else {
        setIpError('Invalid format. Enter an IP address (IPv4/IPv6), domain name, or wildcard domain (e.g., *.example.com)')
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="IP Whitelist Management" size="lg">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="192.168.1.1, example.com, or *.example.com"
              value={newIp}
              onChange={(e: any) => {
                setNewIp(e.target.value)
                if (ipError) setIpError('') // Clear error on input
              }}
              onKeyDown={(e: any) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddIp()
                }
              }}
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
              <div className="text-center py-6">
                <p className="text-gray-500 mb-2">No IPs in whitelist for this type</p>
                <p className="text-xs text-gray-400">Add IP addresses, domains, or wildcard domains (e.g., *.example.com) above</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function Sources() {
  const [editingSource, setEditingSource] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'>('ALL')
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL')
  const queryClient = useQueryClient()

  const { data: sources, isLoading, error } = useQuery({
    queryKey: ['sources'],
    queryFn: () => companiesApi.listSources(),
  })

  const filteredSources = React.useMemo(() => {
    if (!sources?.data) return []
    return sources.data.filter((source) => {
      const matchesSearch = !searchQuery || 
        source.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.companyCode?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'ALL' || source.status === statusFilter
      const matchesApproval = approvalFilter === 'ALL' || 
        (approvalFilter === 'APPROVED' && source.approvalStatus === 'APPROVED') ||
        (approvalFilter === 'PENDING' && (!source.approvalStatus || source.approvalStatus === 'PENDING')) ||
        (approvalFilter === 'REJECTED' && source.approvalStatus === 'REJECTED')
      
      return matchesSearch && matchesStatus && matchesApproval
    })
  }, [sources?.data, searchQuery, statusFilter, approvalFilter])

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

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!sources?.data) return { total: 0, active: 0, ready: 0, pending: 0 }
    const total = sources.data.length
    const active = sources.data.filter(s => s.status === 'ACTIVE').length
    const ready = sources.data.filter(s => {
      const isApproved = s.approvalStatus === 'APPROVED'
      const isEmailVerified = s.emailVerified === true
      const hasHttpEndpoint = !!s.httpEndpoint
      const hasCompanyCode = !!s.companyCode
      const isActive = s.status === 'ACTIVE'
      return isActive && isApproved && isEmailVerified && hasHttpEndpoint && hasCompanyCode
    }).length
    const pending = sources.data.filter(s => s.approvalStatus === 'PENDING' || !s.approvalStatus).length
    return { total, active, ready, pending }
  }, [sources?.data])

  const hasActiveFilters = searchQuery || statusFilter !== 'ALL' || approvalFilter !== 'ALL'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sources</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Import Ready</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.ready}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Source Companies ({filteredSources.length})</CardTitle>
              {hasActiveFilters && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredSources.length} of {sources?.data?.length || 0} sources
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('ALL')
                    setApprovalFilter('ALL')
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
              <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ['sources'] })}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <Input
                label="Search"
                placeholder="Search by name, email, or company code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
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
                  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                ]}
              />
            </div>
            <div className="flex-1">
              <Select
                label="Filter by Approval"
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value as any)}
                options={[
                  { value: 'ALL', label: 'All Approvals' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'REJECTED', label: 'Rejected' },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <ErrorDisplay error={error} title="Failed to load sources" />
          ) : filteredSources.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 text-lg mb-2">No sources found</div>
              {hasActiveFilters && (
                <div className="text-sm text-gray-400">
                  Try adjusting your filters or search query
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Branch Import Ready
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    API Endpoint
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSources.length > 0 ? filteredSources.map((source) => {
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
                    <tr key={source.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-900">{source.companyName}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <span>{source.email}</span>
                          </div>
                          {source.companyCode && (
                            <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded inline-block">
                              {source.companyCode}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <Badge variant={source.status === 'ACTIVE' ? 'success' : 'warning'}>
                            {source.status}
                          </Badge>
                          {source.approvalStatus && (
                            <Badge 
                              variant={source.approvalStatus === 'APPROVED' ? 'success' : source.approvalStatus === 'REJECTED' ? 'danger' : 'warning'}
                              size="sm"
                            >
                              {source.approvalStatus}
                            </Badge>
                          )}
                          {source.emailVerified !== undefined && (
                            <Badge variant={source.emailVerified ? 'success' : 'warning'} size="sm">
                              {source.emailVerified ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Email Verified
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Email Not Verified
                                </span>
                              )}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canImportBranches ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="success" size="sm" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Ready
                            </Badge>
                            <span className="text-xs text-gray-500">All prerequisites met</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Badge variant="warning" size="sm" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Not Ready
                            </Badge>
                            <div className="text-xs text-gray-500 max-w-xs mt-1">
                              Missing: {missingRequirements.join(', ')}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-2">
                          {source.httpEndpoint ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="info" size="sm">HTTP</Badge>
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                {source.httpEndpoint}
                              </code>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge variant="warning" size="sm">HTTP</Badge>
                              <span className="text-gray-400 text-xs">Not configured</span>
                            </div>
                          )}
                          {source.grpcEndpoint && (
                            <div className="flex items-center gap-2">
                              <Badge variant="info" size="sm">gRPC</Badge>
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                {source.grpcEndpoint}
                              </code>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSource(source)}
                            title="Edit Source"
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => healthCheckMutation.mutate(source.id)}
                            loading={healthCheckMutation.isPending}
                            title="Run Health Check"
                            className="hover:bg-green-50 hover:text-green-600"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetHealthMutation.mutate(source.id)}
                            loading={resetHealthMutation.isPending}
                            title="Reset Health"
                            className="hover:bg-orange-50 hover:text-orange-600"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => syncLocationsMutation.mutate(source.id)}
                            loading={syncLocationsMutation.isPending}
                            title="Sync Locations"
                            className="hover:bg-purple-50 hover:text-purple-600"
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
                            className={`hover:bg-indigo-50 hover:text-indigo-600 ${!canImportBranches ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : null}
              </tbody>
            </table>
          </div>
          )}
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
