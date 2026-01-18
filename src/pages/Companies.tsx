import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Building2, RefreshCw, Plus, Search, Filter, Users, CheckCircle, Clock, XCircle, MoreVertical, Eye, Edit, Check, X, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Loader } from '../components/ui/Loader'
import { companiesApi, Company } from '../api/companies'
import { branchImportApi } from '../api/whitelist'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

interface CompanyDetailModalProps {
  company: Company | null
  isOpen: boolean
  onClose: () => void
}

interface CompanyFormModalProps {
  company: Company | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const getInitialFormData = () => ({
  companyName: '',
  email: '',
  type: 'AGENT' as 'AGENT' | 'SOURCE',
  password: '',
  adapterType: '' as '' | 'grpc' | 'http',
  grpcEndpoint: '',
  httpEndpoint: '',
  companyCode: '',
  status: 'ACTIVE' as 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED',
})

const CompanyFormModal: React.FC<CompanyFormModalProps> = ({ company, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(getInitialFormData)

  useEffect(() => {
    if (isOpen) {
      if (company) {
        // Edit mode: populate with company data
        setFormData({
          companyName: company.companyName || '',
          email: company.email || '',
          type: company.type || 'AGENT',
          password: '',
          adapterType: company.adapterType || '',
          grpcEndpoint: company.grpcEndpoint || '',
          httpEndpoint: company.httpEndpoint || '',
          companyCode: company.companyCode || '',
          status: company.status || 'ACTIVE',
        })
      } else {
        // Create mode: reset to empty defaults
        setFormData(getInitialFormData())
      }
    } else {
      // Reset form when modal closes
      setFormData(getInitialFormData())
    }
  }, [company, isOpen])

  const createMutation = useMutation({
    mutationFn: (data: any) => companiesApi.createCompany(data),
    onSuccess: () => {
      toast.success('Company created successfully')
      onSave()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create company')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => companiesApi.updateCompanyDetails(id, data),
    onSuccess: () => {
      toast.success('Company updated successfully')
      onSave()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update company')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.companyName || !formData.email || (!company && !formData.password)) {
      toast.error('Please fill in all required fields')
      return
    }

    const dataToSend: any = {
      companyName: formData.companyName,
      email: formData.email,
      type: formData.type,
      adapterType: formData.adapterType,
      status: formData.status,
    }

    if (formData.password) {
      dataToSend.password = formData.password
    }

    if (formData.grpcEndpoint) {
      dataToSend.grpcEndpoint = formData.grpcEndpoint
    }

    if (formData.type === 'SOURCE') {
      if (formData.companyCode) {
        dataToSend.companyCode = formData.companyCode
      }
      if (formData.httpEndpoint) {
        dataToSend.httpEndpoint = formData.httpEndpoint
      }
    }

    if (company) {
      updateMutation.mutate({ id: company.id, data: dataToSend })
    } else {
      createMutation.mutate(dataToSend)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={company ? 'Edit Company' : 'Create Company'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Company Name"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="AGENT">Agent</option>
              <option value="SOURCE">Source</option>
            </select>
          </div>
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!company}
            helperText={company ? 'Leave blank to keep current password' : undefined}
          />
        </div>

        {formData.type === 'SOURCE' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adapter Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.adapterType}
                  onChange={(e) => setFormData({ ...formData, adapterType: e.target.value as any })}
                >
                  <option value="grpc">gRPC</option>
                  <option value="http">HTTP</option>
                </select>
              </div>
              <Input
                label="Company Code"
                placeholder="CMP00023"
                value={formData.companyCode}
                onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
                helperText="Required for branch import (e.g., CMP00023)"
                required={formData.type === 'SOURCE'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="gRPC Endpoint"
                placeholder="localhost:51062"
                value={formData.grpcEndpoint}
                onChange={(e) => setFormData({ ...formData, grpcEndpoint: e.target.value })}
                helperText="Format: host:port"
              />
              <Input
                label="HTTP Endpoint"
                placeholder="https://api.example.com/locations"
                value={formData.httpEndpoint}
                onChange={(e) => setFormData({ ...formData, httpEndpoint: e.target.value })}
                helperText="Required for branch import"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="ACTIVE">Active</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {company ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({ company, isOpen, onClose }) => {
  if (!company) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Company Details - ${company.companyName}`} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Company Name</label>
            <p className="text-sm text-gray-900">{company.companyName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-sm text-gray-900">{company.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Type</label>
            <p className="text-sm text-gray-900">{company.type}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Badge variant={company.status === 'ACTIVE' ? 'success' : company.status === 'PENDING_VERIFICATION' ? 'warning' : 'danger'}>
              {company.status}
            </Badge>
          </div>
          {company.type === 'SOURCE' && (
            <div>
              <label className="text-sm font-medium text-gray-700">Approval Status</label>
              <Badge 
                variant={
                  company.approvalStatus === 'APPROVED' ? 'success' : 
                  company.approvalStatus === 'REJECTED' ? 'danger' : 
                  'warning'
                }
              >
                {company.approvalStatus || 'PENDING'}
              </Badge>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700">Email Verified</label>
            <Badge variant={company.emailVerified ? 'success' : 'warning'}>
              {company.emailVerified ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Adapter Type</label>
            <p className="text-sm text-gray-900">{company.adapterType || 'N/A'}</p>
          </div>
          {company.type === 'SOURCE' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700">Company Code</label>
                <p className="text-sm text-gray-900 font-mono">{company.companyCode || 'Not set'}</p>
                {!company.companyCode && (
                  <p className="text-xs text-red-600 mt-1">Required for branch import</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">HTTP Endpoint</label>
                <p className="text-sm text-gray-900 break-all">{company.httpEndpoint || 'Not configured'}</p>
                {!company.httpEndpoint && (
                  <p className="text-xs text-red-600 mt-1">Required for branch import</p>
                )}
              </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700">gRPC Endpoint</label>
            <p className="text-sm text-gray-900">{company.grpcEndpoint || 'Not configured'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Created At</label>
            <p className="text-sm text-gray-900">{formatDate(company.createdAt)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Updated At</label>
            <p className="text-sm text-gray-900">{formatDate(company.updatedAt)}</p>
          </div>
        </div>

        {company.users && company.users.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Users</h4>
            <div className="space-y-2">
              {company.users.map((user) => (
                <div key={user.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500">Role: {user.role}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {formatDate(user.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {company.agentAgreements && company.agentAgreements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Agent Agreements</h4>
            <p className="text-sm text-gray-600">{company.agentAgreements.length} agreement(s)</p>
          </div>
        )}

        {company.sourceAgreements && company.sourceAgreements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Source Agreements</h4>
            <p className="text-sm text-gray-600">{company.sourceAgreements.length} agreement(s)</p>
          </div>
        )}

        {company.sourceLocations && company.sourceLocations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Source Locations</h4>
            <p className="text-sm text-gray-600">{company.sourceLocations.length} location(s)</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  const [highlightCompanyId, setHighlightCompanyId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'SOURCE' | 'AGENT'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Read initial filter values from URL query parameters
  useEffect(() => {
    const statusParam = searchParams.get('status')
    const highlightParam = searchParams.get('highlight')
    
    if (statusParam && ['ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'].includes(statusParam)) {
      setFilterStatus(statusParam as 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED')
    }
    
    if (highlightParam) {
      setHighlightCompanyId(highlightParam)
      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightCompanyId(null)
        // Remove highlight from URL
        const newParams = new URLSearchParams(searchParams)
        newParams.delete('highlight')
        setSearchParams(newParams, { replace: true })
      }, 3000)
    }
  }, [searchParams, setSearchParams])

  const queryClient = useQueryClient()

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.listCompanies(),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' }) =>
      companiesApi.updateCompanyStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company status updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update company status')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesApi.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company deleted successfully')
      setCompanyToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete company')
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => companiesApi.approveCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company approved and email verified successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to approve company'
      toast.error(errorMessage)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => companiesApi.rejectCompany(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company rejected successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject company')
    },
  })

  const importBranchesMutation = useMutation({
    mutationFn: (sourceId: string) => branchImportApi.importBranches(sourceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
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
        userMessage = 'Source must be approved before importing branches. Click the "Approve" button next to the source to approve it first.'
      } else if (errorCode === 'EMAIL_NOT_VERIFIED') {
        userMessage = 'Source email must be verified before importing branches.'
      } else if (errorCode === 'HTTP_ENDPOINT_NOT_CONFIGURED') {
        userMessage = 'Source HTTP endpoint must be configured before importing branches.'
      } else if (errorCode === 'COMPANY_CODE_MISSING') {
        userMessage = 'Source company code is missing. Please set it in the Edit form.'
      } else if (errorCode === 'COMPANY_CODE_MISMATCH') {
        const expectedCode = errorData?.message?.match(/Expected CompanyCode (.+?),/)?.[1]
        const gotCode = errorData?.message?.match(/got (.+)$/)?.[1]
        userMessage = `CompanyCode mismatch: Source has "${expectedCode || 'unknown'}" but branches have "${gotCode || 'unknown'}". Please update the source's Company Code to match the branch data.`
      } else if (errorCode === 'VALIDATION_FAILED') {
        const errorCount = errorData?.errors?.length || 0
        const firstError = errorData?.errors?.[0]?.error?.error
        if (firstError === 'CompanyCode mismatch') {
          userMessage = `${errorCount} branch(es) have CompanyCode mismatch. The CompanyCode in each branch must match the source's Company Code. Please check the source's Company Code in the Edit form.`
        } else {
          userMessage = `${errorCount} branch(es) failed validation: ${firstError || 'See details below'}`
        }
        // Show validation errors in console for debugging
        if (errorData?.errors) {
          console.error('Branch validation errors:', errorData.errors)
        }
      } else if (errorCode === 'WHITELIST_VIOLATION') {
        userMessage = 'Source endpoint is not whitelisted. Please add it to the IP whitelist first.'
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

  const handleStatusChange = (companyId: string, newStatus: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED') => {
    updateStatusMutation.mutate({ id: companyId, status: newStatus })
  }

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company)
    setIsDetailModalOpen(true)
  }

  const handleEditClick = (company: Company) => {
    setCompanyToEdit(company)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company)
  }

  const confirmDelete = () => {
    if (companyToDelete) {
      deleteMutation.mutate(companyToDelete.id)
    }
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['companies'] })
  }

  const filteredCompanies = companies?.data?.filter((company) => {
    const typeMatch = filterType === 'ALL' || company.type === filterType
    const statusMatch = filterStatus === 'ALL' || company.status === filterStatus
    const searchMatch = !searchQuery || 
      company.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.companyCode?.toLowerCase().includes(searchQuery.toLowerCase())
    return typeMatch && statusMatch && searchMatch
  }) || []

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

  const allCompanies = companies?.data || []
  const stats = {
    total: allCompanies.length,
    sources: allCompanies.filter(c => c.type === 'SOURCE').length,
    agents: allCompanies.filter(c => c.type === 'AGENT').length,
    active: allCompanies.filter(c => c.status === 'ACTIVE').length,
    pending: allCompanies.filter(c => c.status === 'PENDING_VERIFICATION').length,
    suspended: allCompanies.filter(c => c.status === 'SUSPENDED').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gray-100 rounded">
            <Building2 className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Companies
            </h1>
            <p className="mt-2 text-gray-600 font-medium">
              Manage all companies (sources and agents) in the system
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <Users className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Sources</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.sources}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <Building2 className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Agents</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.agents}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <Users className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <CheckCircle className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pending}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <Clock className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Suspended</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.suspended}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <XCircle className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Companies Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                All Companies
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {filteredCompanies.length} of {stats.total} companies
                {(searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL') && ' (filtered)'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={handleRefresh}
                className="shadow-md hover:shadow-lg transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Company
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or company code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm hover:border-gray-400"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Select
                  label="Filter by Type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  options={[
                    { value: 'ALL', label: 'All Types' },
                    { value: 'SOURCE', label: 'Sources' },
                    { value: 'AGENT', label: 'Agents' },
                  ]}
                />
              </div>
              <div className="flex-1">
                <Select
                  label="Filter by Status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                    { value: 'SUSPENDED', label: 'Suspended' },
                  ]}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCompanies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Approval
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompanies.map((company) => (
                    <tr 
                      key={company.id} 
                      className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                        highlightCompanyId === company.id ? 'bg-yellow-100 ring-2 ring-yellow-400' : ''
                      }`}
                      onClick={() => handleCompanyClick(company)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{company.companyName}</div>
                            <div className="text-sm text-gray-500">{company.email}</div>
                            {company.companyCode && (
                              <div className="text-xs text-gray-400 font-mono mt-1">{company.companyCode}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={company.type === 'SOURCE' ? 'info' : 'default'} className="font-semibold">
                          {company.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={company.status === 'ACTIVE' ? 'success' : company.status === 'PENDING_VERIFICATION' ? 'warning' : 'danger'}
                          className="font-semibold"
                        >
                          {company.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {company.type === 'SOURCE' ? (
                          <Badge 
                            variant={
                              company.approvalStatus === 'APPROVED' ? 'success' : 
                              company.approvalStatus === 'REJECTED' ? 'danger' : 
                              'warning'
                            }
                            className="font-semibold"
                          >
                            {company.approvalStatus || 'PENDING'}
                          </Badge>
                        ) : (
                          company.approvalStatus && (
                            <Badge 
                              variant={
                                company.approvalStatus === 'APPROVED' ? 'success' : 
                                company.approvalStatus === 'REJECTED' ? 'danger' : 
                                'warning'
                              }
                              className="font-semibold"
                            >
                              {company.approvalStatus}
                            </Badge>
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-medium">{formatDate(company.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === company.id ? null : company.id)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Actions menu"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-600" />
                          </button>
                          
                          {openMenuId === company.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                                <button
                                  onClick={() => {
                                    handleCompanyClick(company)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </button>
                                
                                <button
                                  onClick={() => {
                                    handleEditClick(company)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </button>
                                
                                {company.type === 'SOURCE' && company.approvalStatus !== 'APPROVED' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        // Backend will automatically verify email when approving
                                        approveMutation.mutate(company.id)
                                        setOpenMenuId(null)
                                      }}
                                      disabled={approveMutation.isPending}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Check className="h-4 w-4" />
                                      {approveMutation.isPending ? 'Approving...' : 'Approve'}
                                    </button>
                                    
                                    {company.approvalStatus !== 'REJECTED' && (
                                      <button
                                        onClick={() => {
                                          const reason = prompt('Enter rejection reason (optional):')
                                          rejectMutation.mutate({ id: company.id, reason: reason || undefined })
                                          setOpenMenuId(null)
                                        }}
                                        disabled={rejectMutation.isPending}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <X className="h-4 w-4" />
                                        {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                                      </button>
                                    )}
                                  </>
                                )}
                                
                                {company.type === 'SOURCE' && (
                                  <button
                                    onClick={() => {
                                      if (company.status !== 'ACTIVE') {
                                        toast.error('Source must be ACTIVE to import branches')
                                        setOpenMenuId(null)
                                        return
                                      }
                                      if (company.approvalStatus !== 'APPROVED') {
                                        toast.error('Source must be APPROVED to import branches')
                                        setOpenMenuId(null)
                                        return
                                      }
                                      importBranchesMutation.mutate(company.id)
                                      setOpenMenuId(null)
                                    }}
                                    disabled={importBranchesMutation.isPending || company.status !== 'ACTIVE' || company.approvalStatus !== 'APPROVED'}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Download className="h-4 w-4" />
                                    {importBranchesMutation.isPending ? 'Importing...' : 'Import Branches'}
                                  </button>
                                )}
                                
                                <div className="border-t border-gray-200 my-1" />
                                
                                <div className="px-4 py-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Status</label>
                                  <select
                                    value={company.status}
                                    onChange={(e) => {
                                      handleStatusChange(company.id, e.target.value as any)
                                      setOpenMenuId(null)
                                    }}
                                    disabled={updateStatusMutation.isPending}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <option value="ACTIVE">Active</option>
                                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                                    <option value="SUSPENDED">Suspended</option>
                                  </select>
                                </div>
                                
                                <div className="border-t border-gray-200 my-1" />
                                
                                <button
                                  onClick={() => {
                                    handleDeleteClick(company)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-gray-400" />
              </div>
              <div className="text-gray-500 text-lg font-semibold mb-2">No companies found</div>
              {(searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL') ? (
                <div className="text-sm text-gray-400 mb-4">
                  Try adjusting your filters or search query
                </div>
              ) : (
                <div className="text-sm text-gray-400 mb-4">
                  Get started by creating your first company
                </div>
              )}
              {!searchQuery && filterType === 'ALL' && filterStatus === 'ALL' && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Company
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyDetailModal
        company={selectedCompany}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedCompany(null)
        }}
      />

      <CompanyFormModal
        key="create-company-modal"
        company={null}
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
        }}
        onSave={handleRefresh}
      />

      <CompanyFormModal
        key={`edit-company-modal-${companyToEdit?.id || 'new'}`}
        company={companyToEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setCompanyToEdit(null)
        }}
        onSave={handleRefresh}
      />

      <Modal
        isOpen={!!companyToDelete}
        onClose={() => setCompanyToDelete(null)}
        title="Delete Company"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <strong>{companyToDelete?.companyName}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCompanyToDelete(null)} type="button">
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
