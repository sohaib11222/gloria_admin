import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, MapPin, Edit, Trash2, Filter, X, RefreshCw, Building2, TrendingUp, AlertCircle, Database, Eye, Download, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { BranchEditModal } from '../components/BranchEditModal'
import { branchesApi, Branch, BranchStats, CreateBranchRequest } from '../api/branches'
import { companiesApi } from '../api/companies'
import { branchImportApi } from '../api/whitelist'
import toast from 'react-hot-toast'
import { formatDate } from '../lib/utils'

function BranchJsonPanel({ title, value }: { title: string; value: unknown }) {
  const empty =
    value == null ||
    (typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value as object).length === 0)

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
        {title}
      </div>
      <div className="p-3 min-h-[2.5rem]">
        {empty ? (
          <span className="text-sm text-gray-400">No data</span>
        ) : (
          <pre className="text-xs leading-relaxed bg-gray-950 text-gray-100 rounded-md p-3 overflow-x-auto max-h-72 overflow-y-auto whitespace-pre-wrap break-words font-mono">
            {JSON.stringify(value, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

interface AddBranchModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  sources: Array<{ id: string; companyName: string }>
}

const AddBranchModal: React.FC<AddBranchModalProps> = ({ isOpen, onClose, onSuccess, sources }) => {
  const [formData, setFormData] = useState<CreateBranchRequest>({
    sourceId: '',
    branchCode: '',
    name: '',
    status: null,
    locationType: null,
    collectionType: null,
    email: null,
    phone: null,
    latitude: null,
    longitude: null,
    addressLine: null,
    city: null,
    postalCode: null,
    country: null,
    countryCode: null,
    natoLocode: null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = useMutation({
    mutationFn: (data: CreateBranchRequest) => branchesApi.createBranch(data),
    onSuccess: () => {
      toast.success('Branch created successfully')
      onSuccess()
      onClose()
      // Reset form
      setFormData({
        sourceId: '',
        branchCode: '',
        name: '',
        status: null,
        locationType: null,
        collectionType: null,
        email: null,
        phone: null,
        latitude: null,
        longitude: null,
        addressLine: null,
        city: null,
        postalCode: null,
        country: null,
        countryCode: null,
        natoLocode: null,
      })
      setErrors({})
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create branch'
      const errorCode = error.response?.data?.error
      const errorDetails = error.response?.data?.details

      if (errorCode === 'VALIDATION_ERROR' && errorDetails) {
        const newErrors: Record<string, string> = {}
        errorDetails.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            newErrors[err.path[0]] = err.message
          }
        })
        setErrors(newErrors)
      } else if (errorCode === 'BRANCH_CODE_EXISTS') {
        setErrors({ branchCode: errorMessage })
      } else if (errorCode === 'INVALID_UNLOCODE') {
        setErrors({ natoLocode: errorMessage })
      } else {
        toast.error(errorMessage)
      }
    },
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.sourceId) {
      newErrors.sourceId = 'Source is required'
    }
    if (!formData.branchCode || formData.branchCode.trim().length === 0) {
      newErrors.branchCode = 'Branch code is required'
    }
    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Name is required'
    }
    if (formData.email && formData.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format'
      }
    }
    if (formData.latitude !== null && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90'
    }
    if (formData.longitude !== null && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      createMutation.mutate(formData)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Branch" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.sourceId}
              onChange={(e) => {
                setFormData({ ...formData, sourceId: e.target.value })
                if (errors.sourceId) setErrors({ ...errors, sourceId: '' })
              }}
              required
            >
              <option value="">Select a source</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.companyName}
                </option>
              ))}
            </select>
            {errors.sourceId && (
              <p className="mt-1 text-sm text-red-600">{errors.sourceId}</p>
            )}
          </div>
          <Input
            label="Branch Code *"
            placeholder="e.g., BR001"
            value={formData.branchCode}
            onChange={(e) => {
              setFormData({ ...formData, branchCode: e.target.value })
              if (errors.branchCode) setErrors({ ...errors, branchCode: '' })
            }}
            error={errors.branchCode}
            required
          />
        </div>

        <Input
          label="Name *"
          placeholder="Branch name"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value })
            if (errors.name) setErrors({ ...errors, name: '' })
          }}
          error={errors.name}
          required
        />

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value || null })}
            >
              <option value="">None</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.locationType || ''}
              onChange={(e) => setFormData({ ...formData, locationType: e.target.value || null })}
            >
              <option value="">None</option>
              <option value="AIRPORT">Airport</option>
              <option value="CITY">City</option>
              <option value="RAILWAY">Railway</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.collectionType || ''}
              onChange={(e) => setFormData({ ...formData, collectionType: e.target.value || null })}
            >
              <option value="">None</option>
              <option value="PICKUP">Pickup</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="branch@example.com"
            value={formData.email || ''}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value || null })
              if (errors.email) setErrors({ ...errors, email: '' })
            }}
            error={errors.email}
          />
          <Input
            label="Phone"
            placeholder="+1234567890"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            placeholder="City name"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value || null })}
          />
          <Input
            label="Country"
            placeholder="Country name"
            value={formData.country || ''}
            onChange={(e) => setFormData({ ...formData, country: e.target.value || null })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Country Code"
            placeholder="e.g., GB, US"
            value={formData.countryCode || ''}
            onChange={(e) => setFormData({ ...formData, countryCode: e.target.value || null })}
            maxLength={2}
          />
          <Input
            label="Postal Code"
            placeholder="Postal/ZIP code"
            value={formData.postalCode || ''}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value || null })}
          />
        </div>

        <Input
          label="Address Line"
          placeholder="Street address"
          value={formData.addressLine || ''}
          onChange={(e) => setFormData({ ...formData, addressLine: e.target.value || null })}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Latitude"
            type="number"
            step="any"
            placeholder="e.g., 53.3656"
            value={formData.latitude !== null ? formData.latitude.toString() : ''}
            onChange={(e) => {
              const val = e.target.value
              setFormData({ ...formData, latitude: val ? parseFloat(val) : null })
              if (errors.latitude) setErrors({ ...errors, latitude: '' })
            }}
            error={errors.latitude}
            helperText="Optional, -90 to 90"
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            placeholder="e.g., -2.2729"
            value={formData.longitude !== null ? formData.longitude.toString() : ''}
            onChange={(e) => {
              const val = e.target.value
              setFormData({ ...formData, longitude: val ? parseFloat(val) : null })
              if (errors.longitude) setErrors({ ...errors, longitude: '' })
            }}
            error={errors.longitude}
            helperText="Optional, -180 to 180"
          />
          <Input
            label="UN/LOCODE"
            placeholder="e.g., GBMAN"
            value={formData.natoLocode || ''}
            onChange={(e) => {
              setFormData({ ...formData, natoLocode: e.target.value.toUpperCase() || null })
              if (errors.natoLocode) setErrors({ ...errors, natoLocode: '' })
            }}
            error={errors.natoLocode}
            helperText="Optional, will be validated"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Create Branch
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Branches() {
  const [filters, setFilters] = useState({
    sourceId: '',
    status: '',
    locationType: '',
    search: '',
  })
  const [page, setPage] = useState(0)
  const [limit] = useState(25)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isImportSourceModalOpen, setIsImportSourceModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [showStats, setShowStats] = useState(true)

  const queryClient = useQueryClient()

  // Fetch branches
  const { data: branchesData, isLoading, error } = useQuery({
    queryKey: ['branches', filters, page],
    queryFn: () =>
      branchesApi.listBranches({
        ...filters,
        limit,
        offset: page * limit,
      }),
  })

  // Fetch sources for filter
  const { data: sourcesData } = useQuery({
    queryKey: ['sources'],
    queryFn: () => companiesApi.listCompanies(),
  })

  const sources = (sourcesData?.data ?? []).filter((c: any) => c.type === 'SOURCE')

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['branchStats', filters.sourceId],
    queryFn: () => branchesApi.getBranchStats(filters.sourceId || undefined),
    enabled: showStats,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchesApi.deleteBranch(id),
    onSuccess: () => {
      toast.success('Branch deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      queryClient.invalidateQueries({ queryKey: ['branchStats'] })
      setIsDeleteModalOpen(false)
      setSelectedBranch(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete branch')
    },
  })

  // Import branches mutation
  const importBranchesMutation = useMutation({
    mutationFn: (sourceId: string) => branchImportApi.importBranches(sourceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      queryClient.invalidateQueries({ queryKey: ['branchStats'] })
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
      }
      
      toast.error(userMessage)
    },
  })

  const handleImportBranches = () => {
    // If source is already selected, import directly
    if (filters.sourceId) {
      const selectedSource = sources.find((s: any) => s.id === filters.sourceId)
      if (!selectedSource) {
        toast.error('Selected source not found')
        return
      }

      // Check prerequisites
      if (selectedSource.status !== 'ACTIVE') {
        toast.error('Source must be ACTIVE to import branches')
        return
      }
      if (selectedSource.approvalStatus !== 'APPROVED') {
        toast.error('Source must be APPROVED to import branches')
        return
      }

      importBranchesMutation.mutate(filters.sourceId)
      return
    }

    // If no source selected, show modal to select one
    const eligibleSources = sources.filter((s: any) => 
      s.status === 'ACTIVE' && s.approvalStatus === 'APPROVED'
    )

    if (eligibleSources.length === 0) {
      toast.error('No eligible sources found. Sources must be ACTIVE and APPROVED to import branches.')
      return
    }

    // If only one eligible source, use it directly
    if (eligibleSources.length === 1) {
      importBranchesMutation.mutate(eligibleSources[0].id)
      return
    }

    // Multiple sources - show modal
    setIsImportSourceModalOpen(true)
  }

  const handleImportFromSource = (sourceId: string) => {
    setIsImportSourceModalOpen(false)
    importBranchesMutation.mutate(sourceId)
  }

  const handleDelete = () => {
    if (selectedBranch) {
      deleteMutation.mutate(selectedBranch.id)
    }
  }

  const clearFilters = () => {
    setFilters({
      sourceId: '',
      status: '',
      locationType: '',
      search: '',
    })
    setPage(0)
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded">
              <Building2 className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Branches</h1>
              <p className="mt-1 text-sm text-gray-600">Manage source branches and locations</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide' : 'Show'} Stats
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded">
                <TrendingUp className="w-5 h-5 text-gray-700" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">Branch Statistics</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">Total Branches</div>
                  <Database className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">Unmapped</div>
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{stats.unmapped}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">By Source</div>
                  <Building2 className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {stats.bySource.length} source{stats.bySource.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">By Status</div>
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {stats.byStatus.length} status{stats.byStatus.length !== 1 ? 'es' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded">
                <Filter className="w-5 h-5 text-gray-700" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">Filters</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-900 hover:bg-white/50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select
                label="Source"
                value={filters.sourceId}
                onChange={(e) => {
                  setFilters({ ...filters, sourceId: e.target.value })
                  setPage(0)
                }}
                options={[
                  { value: '', label: 'All sources' },
                  ...sources.map((s: any) => ({
                    value: s.id,
                    label: s.companyName,
                  })),
                ]}
              />
            </div>
            <div>
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value })
                  setPage(0)
                }}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
              />
            </div>
            <div>
              <Select
                label="Location Type"
                value={filters.locationType}
                onChange={(e) => {
                  setFilters({ ...filters, locationType: e.target.value })
                  setPage(0)
                }}
                options={[
                  { value: '', label: 'All types' },
                  { value: 'AIRPORT', label: 'Airport' },
                  { value: 'CITY', label: 'City' },
                  { value: 'RAILWAY', label: 'Railway' },
                ]}
              />
            </div>
            <div>
              <Input
                label="Search"
                placeholder="Code, name, city, country, UN/LOCODE, email…"
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value })
                  setPage(0)
                }}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {branchesData?.items?.length ?? 0} of {branchesData?.total ?? 0} branches
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branches Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded">
                <MapPin className="w-5 h-5 text-gray-700" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Branches ({branchesData?.total ?? 0})
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="primary" 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Branch
              </Button>
              <Button 
                variant="primary" 
                onClick={handleImportBranches}
                loading={importBranchesMutation.isPending}
                title={filters.sourceId ? "Import branches from the selected source's supplier endpoint" : "Import branches from available sources"}
              >
                <Download className="h-4 w-4 mr-2" />
                Import Branches
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
                className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <Loader className="min-h-48" />
          ) : error ? (
            <ErrorDisplay 
              error={error} 
              title="Failed to load branches"
              onDismiss={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
            />
          ) : (branchesData?.items ?? []).length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-gray-500 text-lg font-medium mb-2">No branches found</div>
              {hasActiveFilters && (
                <div className="text-sm text-gray-400 mb-4">
                  Try adjusting your filters or search query
                </div>
              )}
              {hasActiveFilters && (
                <Button variant="secondary" onClick={clearFilters} size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Branch Code
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type / collection
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        UN/LOCODE
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(branchesData?.items ?? []).map((branch) => (
                      <tr key={branch.id} className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {branch.branchCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{branch.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {branch.source?.companyName || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {[branch.city, branch.country, branch.countryCode ? `(${branch.countryCode})` : null]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 max-w-[10rem]">
                          <div className="truncate" title={[branch.locationType, branch.collectionType].filter(Boolean).join(' · ') || undefined}>
                            {branch.locationType || branch.collectionType
                              ? [branch.locationType, branch.collectionType].filter(Boolean).join(' · ')
                              : '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              branch.status === 'ACTIVE'
                                ? 'success'
                                : branch.status === 'INACTIVE'
                                ? 'danger'
                                : 'default'
                            }
                          >
                            {branch.status || '—'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {branch.natoLocode ? (
                            <Badge variant="info">{branch.natoLocode}</Badge>
                          ) : (
                            <Badge variant="warning">Unmapped</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBranch(branch)
                                setIsDetailModalOpen(true)
                              }}
                              className="hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBranch(branch)
                                setIsEditModalOpen(true)
                              }}
                              className="hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBranch(branch)
                                setIsDeleteModalOpen(true)
                              }}
                              className="hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {branchesData && branchesData.total > limit && (
                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600 font-medium">
                    Showing <span className="font-semibold text-gray-900">{page * limit + 1}</span> to{' '}
                    <span className="font-semibold text-gray-900">{Math.min((page + 1) * limit, branchesData.total)}</span> of{' '}
                    <span className="font-semibold text-gray-900">{branchesData.total}</span> branches
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!branchesData.hasMore}
                      className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Branch Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedBranch(null)
        }}
        title={
          <div className="flex items-start gap-3 pr-8">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold text-gray-900">Branch details</div>
              {selectedBranch ? (
                <div className="text-sm text-gray-500 font-mono mt-0.5 truncate max-w-[75vw]">
                  {selectedBranch.branchCode} · {selectedBranch.name}
                </div>
              ) : null}
            </div>
          </div>
        }
        size="full"
      >
        {selectedBranch && (
          <div className="space-y-6 max-w-5xl mx-auto w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Branch code</div>
                <div className="mt-1 text-sm font-mono font-semibold text-gray-900 break-all">{selectedBranch.branchCode}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 lg:col-span-2">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Display name</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{selectedBranch.name}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Source</div>
                <div className="mt-1 text-sm text-gray-900">{selectedBranch.source?.companyName ?? '—'}</div>
                {selectedBranch.source?.companyCode ? (
                  <div className="text-xs text-gray-500 mt-0.5">Code: {selectedBranch.source.companyCode}</div>
                ) : null}
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</div>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedBranch.status === 'ACTIVE'
                        ? 'success'
                        : selectedBranch.status === 'INACTIVE'
                        ? 'danger'
                        : 'default'
                    }
                  >
                    {selectedBranch.status ?? '—'}
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">UN/LOCODE</div>
                <div className="mt-1">
                  {selectedBranch.natoLocode ? (
                    <Badge variant="info">{selectedBranch.natoLocode}</Badge>
                  ) : (
                    <Badge variant="warning">Unmapped</Badge>
                  )}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 sm:col-span-2 lg:col-span-3">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Internal IDs</div>
                <div className="mt-1 text-xs font-mono text-gray-700 break-all space-y-0.5">
                  <div>Branch: {selectedBranch.id}</div>
                  <div>SourceId: {selectedBranch.sourceId}</div>
                  {selectedBranch.agreementId ? <div>AgreementId: {selectedBranch.agreementId}</div> : null}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Classification and contact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Location type</div>
                  <div className="mt-1 text-sm text-gray-900">{selectedBranch.locationType ?? '—'}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Collection type</div>
                  <div className="mt-1 text-sm text-gray-900">{selectedBranch.collectionType ?? '—'}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Email</div>
                  <div className="mt-1 text-sm text-gray-900 break-all">{selectedBranch.email ?? '—'}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Phone</div>
                  <div className="mt-1 text-sm text-gray-900">{selectedBranch.phone ?? '—'}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Address</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200 sm:col-span-2">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Street / address</div>
                  <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedBranch.addressLine ?? '—'}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">City</div>
                  <div className="mt-1 text-sm text-gray-900">{selectedBranch.city ?? '—'}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Postal code</div>
                  <div className="mt-1 text-sm text-gray-900">{selectedBranch.postalCode ?? '—'}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Country</div>
                  <div className="mt-1 text-sm text-gray-900">{selectedBranch.country ?? '—'}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Country code</div>
                  <div className="mt-1 text-sm font-mono text-gray-900">{selectedBranch.countryCode ?? '—'}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Geo</h4>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Latitude / longitude</div>
                <div className="mt-1 text-sm font-mono text-gray-900">
                  {selectedBranch.latitude != null && selectedBranch.longitude != null
                    ? `${selectedBranch.latitude}, ${selectedBranch.longitude}`
                    : selectedBranch.latitude != null || selectedBranch.longitude != null
                      ? `${selectedBranch.latitude ?? '—'}, ${selectedBranch.longitude ?? '—'}`
                      : '—'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BranchJsonPanel title="Pickup times (JSON)" value={selectedBranch.pickupTimes} />
              <BranchJsonPanel title="Dropoff times (JSON)" value={selectedBranch.dropoffTimes} />
            </div>

            <BranchJsonPanel title="Supplier raw payload (rawJson)" value={selectedBranch.rawJson} />

            <div className="pt-2 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
              <span>
                Created: <span className="font-medium text-gray-900">{formatDate(selectedBranch.createdAt)}</span>
              </span>
              <span>
                Updated: <span className="font-medium text-gray-900">{formatDate(selectedBranch.updatedAt)}</span>
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <BranchEditModal
        branch={selectedBranch}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedBranch(null)
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedBranch(null)
        }}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg text-white">
              <Trash2 className="w-5 h-5" />
            </div>
            <span>Delete Branch</span>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-gray-700">
              Are you sure you want to delete branch <strong className="font-semibold text-gray-900">{selectedBranch?.branchCode}</strong>? 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setSelectedBranch(null)
              }}
              className="bg-white hover:bg-gray-50 border border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete} 
              loading={deleteMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
            >
              Delete Branch
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Source Selection Modal */}
      <Modal
        isOpen={isImportSourceModalOpen}
        onClose={() => setIsImportSourceModalOpen(false)}
        title="Select Source to Import Branches"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Select a source to import branches from its supplier endpoint. Only active and approved sources are shown.
          </p>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sources
              .filter((s: any) => s.status === 'ACTIVE' && s.approvalStatus === 'APPROVED')
              .map((source: any) => (
                <button
                  key={source.id}
                  onClick={() => handleImportFromSource(source.id)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-indigo-700">
                        {source.companyName}
                      </div>
                      {source.companyCode && (
                        <div className="text-sm text-gray-500 mt-1">
                          Code: {source.companyCode}
                        </div>
                      )}
                    </div>
                    <Download className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </button>
              ))}
          </div>

          {sources.filter((s: any) => s.status === 'ACTIVE' && s.approvalStatus === 'APPROVED').length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No eligible sources found.</p>
              <p className="text-sm mt-1">Sources must be ACTIVE and APPROVED to import branches.</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => setIsImportSourceModalOpen(false)}
              className="bg-white hover:bg-gray-50 border border-gray-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Branch Modal */}
      <AddBranchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['branches'] })
          queryClient.invalidateQueries({ queryKey: ['branchStats'] })
        }}
        sources={sources}
      />
    </div>
  )
}

