import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Loader } from '../components/ui/Loader'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { agreementsApi, Agreement } from '../api/agreements'
import { companiesApi } from '../api/companies'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'
import { RefreshCw, FileText, Search, Plus, Eye, Play, Pause, Calendar, Building2, Users, Filter, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'

interface AgreementDetailModalProps {
  agreement: Agreement | null
  isOpen: boolean
  onClose: () => void
}

const AgreementDetailModal: React.FC<AgreementDetailModalProps> = ({ agreement, isOpen, onClose }) => {
  if (!agreement) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'ACCEPTED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'SUSPENDED':
        return <Pause className="w-5 h-5 text-yellow-600" />
      case 'EXPIRED':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'OFFERED':
      case 'DRAFT':
        return <Clock className="w-5 h-5 text-blue-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Agreement Details`} size="lg">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-blue-50 rounded p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <code className="text-lg font-bold text-blue-700">{agreement.agreementRef}</code>
              <div className="flex items-center gap-2 mt-2">
                {getStatusIcon(agreement.status)}
                <Badge variant={agreement.status === 'ACTIVE' ? 'success' : agreement.status === 'ACCEPTED' ? 'success' : agreement.status === 'SUSPENDED' ? 'warning' : agreement.status === 'EXPIRED' ? 'danger' : 'info'}>
                  {agreement.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Details */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Agreement Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" />
                Valid From
              </label>
              <p className="text-sm font-semibold text-gray-900">{formatDate(agreement.validFrom)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" />
                Valid To
              </label>
              <p className="text-sm font-semibold text-gray-900">{formatDate(agreement.validTo)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" />
                Created At
              </label>
              <p className="text-sm font-semibold text-gray-900">{formatDate(agreement.createdAt)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" />
                Updated At
              </label>
              <p className="text-sm font-semibold text-gray-900">{formatDate(agreement.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Agent Details */}
        {agreement.agent && (
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Agent Details
            </h4>
            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Company Name</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{agreement.agent.companyName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{agreement.agent.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Type</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{agreement.agent.type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={agreement.agent.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                      {agreement.agent.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Source Details */}
        {agreement.source && (
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Source Details
            </h4>
            <div className="p-4 bg-purple-50 rounded border border-purple-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Company Name</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{agreement.source.companyName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{agreement.source.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Type</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{agreement.source.type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={agreement.source.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                      {agreement.source.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function AgreementsManagement() {
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'OFFERED' | 'ACTIVE' | 'ACCEPTED' | 'SUSPENDED' | 'EXPIRED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [confirmProceed, setConfirmProceed] = useState<null | { duplicate: boolean; message: string; payload: any }>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<{ agreementRef: string; agentId: string; sourceId: string; validFrom: string; validTo: string }>({ agreementRef: '', agentId: '', sourceId: '', validFrom: '', validTo: '' })

  const queryClient = useQueryClient()

  const { data: agreements, isLoading, error } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => agreementsApi.listAgreements(),
  })

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => companiesApi.listAgents(),
  })

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: () => companiesApi.listSources(),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => agreementsApi.activateAgreement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] })
      toast.success('Agreement activated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate agreement')
    },
  })

  const suspendMutation = useMutation({
    mutationFn: (id: string) => agreementsApi.suspendAgreement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] })
      toast.success('Agreement suspended successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to suspend agreement')
    },
  })

  const expireMutation = useMutation({
    mutationFn: (id: string) => agreementsApi.expireAgreement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] })
      toast.success('Agreement expired successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to expire agreement')
    },
  })

  const handleAgreementClick = (agreement: Agreement) => {
    setSelectedAgreement(agreement)
    setIsDetailModalOpen(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'ACCEPTED':
        return 'success'
      case 'SUSPENDED':
        return 'warning'
      case 'EXPIRED':
        return 'danger'
      case 'OFFERED':
      case 'DRAFT':
        return 'info'
      default:
        return 'default'
    }
  }

  const getAvailableActions = (agreement: Agreement) => {
    const actions = []
    
    // Only show Activate for ACCEPTED agreements (correct transition flow)
    if (agreement.status === 'ACCEPTED') {
      actions.push(
        <Button
          key="activate"
          size="sm"
          variant="primary"
          onClick={() => activateMutation.mutate(agreement.id)}
          loading={activateMutation.isPending}
          disabled={activateMutation.isPending || suspendMutation.isPending || expireMutation.isPending}
          className="hover:bg-green-600"
        >
          <Play className="w-4 h-4 mr-1" />
          Activate
        </Button>
      )
    }
    
    if (agreement.status === 'ACTIVE') {
      actions.push(
        <Button
          key="suspend"
          size="sm"
          variant="secondary"
          onClick={() => suspendMutation.mutate(agreement.id)}
          loading={suspendMutation.isPending}
          disabled={activateMutation.isPending || suspendMutation.isPending || expireMutation.isPending}
          className="hover:bg-yellow-50 hover:text-yellow-700"
        >
          <Pause className="w-4 h-4 mr-1" />
          Suspend
        </Button>
      )
    }
    
    if (agreement.status === 'ACTIVE' || agreement.status === 'SUSPENDED') {
      actions.push(
        <Button
          key="expire"
          size="sm"
          variant="danger"
          onClick={() => expireMutation.mutate(agreement.id)}
          loading={expireMutation.isPending}
          disabled={activateMutation.isPending || suspendMutation.isPending || expireMutation.isPending}
          className="hover:bg-red-600"
        >
          <XCircle className="w-4 h-4 mr-1" />
          Expire
        </Button>
      )
    }
    
    return actions
  }

  const filteredAgreements = useMemo(() => {
    if (!agreements?.data) return []
    return agreements.data.filter((agreement) => {
      const statusMatch = filterStatus === 'ALL' || agreement.status === filterStatus
      const searchMatch = !searchQuery || 
        agreement.agreementRef?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agreement.agent?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agreement.source?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
      return statusMatch && searchMatch
    })
  }, [agreements?.data, filterStatus, searchQuery])

  const handleCreate = async () => {
    if (!form.agreementRef || !form.agentId || !form.sourceId || !form.validFrom || !form.validTo) {
      toast.error('Please fill all fields')
      return
    }
    try {
      setCreating(true)
      const dup = await agreementsApi.checkDuplicate({
        agreementRef: form.agreementRef,
        agentId: form.agentId,
        sourceId: form.sourceId,
      })
      if (dup?.duplicate) {
        setConfirmProceed({ duplicate: true, message: 'This agreement_ref already exists for this source/agent. Do you want to proceed?', payload: form })
      } else {
        await agreementsApi.createAgreement({
          agreementRef: form.agreementRef,
          agentId: form.agentId,
          sourceId: form.sourceId,
          validFrom: form.validFrom,
          validTo: form.validTo,
        })
        toast.success('Agreement created')
        setIsCreateOpen(false)
        setForm({ agreementRef: '', agentId: '', sourceId: '', validFrom: '', validTo: '' })
        queryClient.invalidateQueries({ queryKey: ['agreements'] })
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create agreement')
    } finally {
      setCreating(false)
    }
  }

  const proceedCreate = async () => {
    if (!confirmProceed) return
    try {
      setCreating(true)
      await agreementsApi.createAgreement({
        agreementRef: form.agreementRef,
        agentId: form.agentId,
        sourceId: form.sourceId,
        validFrom: form.validFrom,
        validTo: form.validTo,
      } as any)
      toast.success('Agreement created')
      setConfirmProceed(null)
      setIsCreateOpen(false)
      setForm({ agreementRef: '', agentId: '', sourceId: '', validFrom: '', validTo: '' })
      queryClient.invalidateQueries({ queryKey: ['agreements'] })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create agreement')
    } finally {
      setCreating(false)
    }
  }

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-100 rounded">
            <FileText className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Agreements Management</h1>
            <p className="mt-1 text-sm text-gray-600">Manage agreements between agents and sources</p>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Agreements ({filteredAgreements.length})</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Search and filter your agreements</p>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['agreements'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Input
                label="Search"
                placeholder="Agreement ref, agent, or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <Select
                label="Filter by Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'OFFERED', label: 'Offered' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'ACCEPTED', label: 'Accepted' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                  { value: 'EXPIRED', label: 'Expired' },
                ]}
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button 
                onClick={() => setIsCreateOpen(true)}
                className="w-full md:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Agreement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Agreements Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Agreements List</CardTitle>
          <p className="text-sm text-gray-600 mt-1">View and manage all agreements</p>
        </CardHeader>
        <CardContent className="p-6">
          {error ? (
            <ErrorDisplay error={error} title="Failed to load agreements" />
          ) : filteredAgreements.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">No agreements found</h3>
              <p className="mt-2 text-sm text-gray-600">
                {filterStatus !== 'ALL' || searchQuery 
                  ? 'Try adjusting your filters or search query' 
                  : 'Create your first agreement to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Agreement Ref
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Agent
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Source
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Valid From
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Valid To
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAgreements.map((agreement) => (
                    <tr key={agreement.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {agreement.agreementRef}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {agreement.agent?.companyName || 'Unknown'}
                        </div>
                        {agreement.agent?.email && (
                          <div className="text-xs text-gray-500 mt-1">{agreement.agent.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {agreement.source?.companyName || 'Unknown'}
                        </div>
                        {agreement.source?.email && (
                          <div className="text-xs text-gray-500 mt-1">{agreement.source.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(agreement.status)}>
                          {agreement.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {formatDate(agreement.validFrom)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {formatDate(agreement.validTo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAgreementClick(agreement)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {getAvailableActions(agreement)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Agreement Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Agreement" size="lg">
        <div className="space-y-6">
          <div className="bg-blue-50 rounded p-4 border border-blue-200">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              Fill in all fields to create a new agreement between an agent and source.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Agreement Reference"
                placeholder="e.g., AGR-2024-001"
                value={form.agreementRef}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, agreementRef: e.target.value })}
              />
            </div>
            <div>
              <Select
                label="Agent"
                value={form.agentId}
                onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                options={[
                  { value: '', label: 'Select agent' },
                  ...(agents?.data || []).map((a: any) => ({
                    value: a.id,
                    label: a.companyName
                  }))
                ]}
              />
            </div>
            <div>
              <Select
                label="Source"
                value={form.sourceId}
                onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
                options={[
                  { value: '', label: 'Select source' },
                  ...(sources?.data || []).map((s: any) => ({
                    value: s.id,
                    label: s.companyName
                  }))
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Valid From
                </div>
              </label>
              <input 
                type="datetime-local" 
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={form.validFrom} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, validFrom: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Valid To
                </div>
              </label>
              <input 
                type="datetime-local" 
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={form.validTo} 
                onChange={(e) => setForm({ ...form, validTo: e.target.value })} 
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              <Plus className="w-4 h-4 mr-2" />
              Create Agreement
            </Button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Confirmation */}
      <Modal isOpen={!!confirmProceed} onClose={() => setConfirmProceed(null)} title="Duplicate Agreement Detected">
        <div className="space-y-4">
          <div className="bg-yellow-50 rounded p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Warning: Duplicate Agreement</p>
                <p className="text-sm text-gray-700">
                  This agreement reference already exists for this source/agent combination. 
                  Creating a duplicate may cause conflicts. Do you want to proceed anyway?
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => setConfirmProceed(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={proceedCreate} loading={creating}>
              <AlertCircle className="w-4 h-4 mr-2" />
              Proceed Anyway
            </Button>
          </div>
        </div>
      </Modal>

      <AgreementDetailModal
        agreement={selectedAgreement}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedAgreement(null)
        }}
      />
    </div>
  )
}
