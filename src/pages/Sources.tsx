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
  AlertTriangle,
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

interface AddSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AddSourceModal: React.FC<AddSourceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    adapterType: '' as '' | 'grpc' | 'http',
    grpcEndpoint: '',
    httpEndpoint: '',
    companyCode: '',
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const createdCompany = await companiesApi.createCompany({
        ...data,
        type: 'SOURCE',
      })
      
      // After successful creation, update companyCode and httpEndpoint if provided
      if (formData.companyCode || formData.httpEndpoint) {
        try {
          const updateData: any = {}
          if (formData.companyCode) {
            updateData.companyCode = formData.companyCode
          }
          if (formData.httpEndpoint) {
            updateData.httpEndpoint = formData.httpEndpoint
          }
          if (Object.keys(updateData).length > 0) {
            await companiesApi.updateCompanyDetails(createdCompany.id, updateData)
          }
        } catch (error) {
          // Log error but don't fail the creation
          console.error('Failed to update company details:', error)
          toast.error('Source created but failed to update additional details')
        }
      }
      
      return createdCompany
    },
    onSuccess: () => {
      toast.success('Source created successfully')
      onSuccess()
      onClose()
      // Reset form
      setFormData({
        companyName: '',
        email: '',
        password: '',
        adapterType: '',
        grpcEndpoint: '',
        httpEndpoint: '',
        companyCode: '',
      })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create source'
      toast.error(errorMessage)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.companyName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields (Company Name, Email, Password)')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    // Validate adapter type specific fields
    if (formData.adapterType === 'grpc' && !formData.grpcEndpoint) {
      toast.error('gRPC endpoint is required when adapter type is gRPC')
      return
    }

    const dataToSend: any = {
      companyName: formData.companyName,
      email: formData.email,
      password: formData.password,
      type: 'SOURCE',
      adapterType: formData.adapterType,
    }

    // Only send grpcEndpoint if adapter type is grpc
    if (formData.adapterType === 'grpc' && formData.grpcEndpoint) {
      dataToSend.grpcEndpoint = formData.grpcEndpoint
    }

    createMutation.mutate(dataToSend)
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Source" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Company Name"
            placeholder="Enter company name"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="company@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <Input
          label="Password"
          type="password"
          placeholder="Minimum 6 characters"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          helperText="Password must be at least 6 characters long"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adapter Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.adapterType}
              onChange={(e) => setFormData({ ...formData, adapterType: e.target.value as any })}
            >
              <option value="grpc">gRPC</option>
              <option value="http">HTTP</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select the adapter type for this source
            </p>
          </div>
          <Input
            label="Company Code"
            placeholder="CMP00023"
            value={formData.companyCode}
            onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
            helperText="Required for branch import (e.g., CMP00023)"
          />
        </div>

        {formData.adapterType === 'grpc' && (
          <Input
            label="gRPC Endpoint"
            placeholder="localhost:9090"
            value={formData.grpcEndpoint}
            onChange={(e) => setFormData({ ...formData, grpcEndpoint: e.target.value })}
            required={formData.adapterType === 'grpc'}
            helperText="gRPC server address (e.g., localhost:9090)"
          />
        )}

        {formData.adapterType === 'http' && (
          <Input
            label="HTTP Endpoint"
            placeholder="https://api.example.com"
            value={formData.httpEndpoint}
            onChange={(e) => setFormData({ ...formData, httpEndpoint: e.target.value })}
            helperText="HTTP API base URL (e.g., https://api.example.com)"
          />
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Create Source
          </Button>
        </div>
      </form>
    </Modal>
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
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
    onSuccess: (data, sourceId) => {
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      toast.success(
        `Branches imported successfully: ${data.imported} new, ${data.updated} updated, ${data.total} total`,
        { 
          duration: 5000,
          id: `import-branches-success-${sourceId}`, // Use ID to prevent duplicate toasts
        }
      )
    },
    onError: (error: any, sourceId: string) => {
      const errorData = error.response?.data
      const errorCode = errorData?.error
      const errorMessage = errorData?.message || 'Failed to import branches'
      
      // Get source details for better error messages
      const source = sources?.data?.find((s: any) => s.id === sourceId)
      
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
        // Provide more helpful message for 404 errors
        if (errorMessage.includes('404')) {
          userMessage = `Supplier endpoint not found (404). Please verify the HTTP endpoint is correct and the supplier service is running.${source?.httpEndpoint ? ` Endpoint: ${source.httpEndpoint}` : ' Endpoint not configured.'}`
        } else {
          userMessage = `Supplier endpoint error: ${errorMessage}. Please check the HTTP endpoint configuration and ensure the supplier service is accessible.${source?.httpEndpoint ? ` Endpoint: ${source.httpEndpoint}` : ''}`
        }
      }
      
      toast.error(userMessage, { 
        duration: 8000,
        id: `import-branches-${sourceId}`, // Use ID to prevent duplicate toasts
      })
    },
  })

  // Calculate stats - MUST be before any early returns to maintain hook order
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

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

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
        <Button onClick={() => setIsAddModalOpen(true)}>
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
            <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Branch Import Ready
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    API Endpoint
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
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
                    <tr key={source.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-900">{source.companyName}</div>
                          <div className="text-sm text-gray-600">{source.email}</div>
                          {source.companyCode && (
                            <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 inline-block">
                              {source.companyCode}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <Badge variant={source.status === 'ACTIVE' ? 'success' : 'warning'} className="w-fit">
                            {source.status}
                          </Badge>
                          {source.adapterType === 'mock' && (
                            <Badge variant="danger" size="sm" className="w-fit" title="This source is using a MOCK adapter - returns fake data for testing only">
                              <span className="flex items-center gap-1.5">
                                <AlertTriangle className="h-3 w-3" />
                                MOCK ADAPTER
                              </span>
                            </Badge>
                          )}
                          <Badge 
                            variant={source.approvalStatus === 'APPROVED' ? 'success' : source.approvalStatus === 'REJECTED' ? 'danger' : 'warning'}
                            size="sm"
                            className="w-fit"
                          >
                            {source.approvalStatus || 'PENDING'}
                          </Badge>
                          {source.emailVerified !== undefined && (
                            <Badge variant={source.emailVerified ? 'success' : 'warning'} size="sm" className="w-fit">
                              {source.emailVerified ? (
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Email Verified
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  Email Not Verified
                                </span>
                              )}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {canImportBranches ? (
                          <div className="flex flex-col gap-2">
                            <Badge variant="success" size="sm" className="w-fit flex items-center gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Ready
                            </Badge>
                            <span className="text-xs text-gray-500">All prerequisites met</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 max-w-xs">
                            <Badge variant="warning" size="sm" className="w-fit flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Not Ready
                            </Badge>
                            <div className="text-xs text-gray-600 leading-relaxed">
                              Missing: {missingRequirements.join(', ')}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-2 min-w-[200px]">
                          {source.httpEndpoint ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="info" size="sm" className="flex-shrink-0">HTTP</Badge>
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono border border-gray-200 break-all">
                                {source.httpEndpoint}
                              </code>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge variant="warning" size="sm" className="flex-shrink-0">HTTP</Badge>
                              <span className="text-gray-400 text-xs">Not configured</span>
                            </div>
                          )}
                          {source.grpcEndpoint && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="info" size="sm" className="flex-shrink-0">gRPC</Badge>
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono border border-gray-200 break-all">
                                {source.grpcEndpoint}
                              </code>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSource(source)}
                            title="Edit Source"
                            className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => healthCheckMutation.mutate(source.id)}
                            loading={healthCheckMutation.isPending}
                            title="Run Health Check"
                            className="p-2 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetHealthMutation.mutate(source.id)}
                            loading={resetHealthMutation.isPending}
                            title="Reset Health"
                            className="p-2 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => syncLocationsMutation.mutate(source.id)}
                            loading={syncLocationsMutation.isPending}
                            title="Sync Locations"
                            className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
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
                            className={`p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors ${!canImportBranches ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['sources'] })
        }}
      />
    </div>
  )
}
