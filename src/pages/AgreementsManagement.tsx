import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Loader } from '../components/ui/Loader'
import { agreementsApi, Agreement } from '../api/agreements'
import { companiesApi } from '../api/companies'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

interface AgreementDetailModalProps {
  agreement: Agreement | null
  isOpen: boolean
  onClose: () => void
}

const AgreementDetailModal: React.FC<AgreementDetailModalProps> = ({ agreement, isOpen, onClose }) => {
  if (!agreement) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Agreement Details - ${agreement.agreementRef}`} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Agreement Reference</label>
            <p className="text-sm text-gray-900">{agreement.agreementRef}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Badge variant={agreement.status === 'ACTIVE' ? 'success' : agreement.status === 'ACCEPTED' ? 'success' : agreement.status === 'SUSPENDED' ? 'warning' : agreement.status === 'EXPIRED' ? 'danger' : 'info'}>
              {agreement.status}
            </Badge>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Valid From</label>
            <p className="text-sm text-gray-900">{formatDate(agreement.validFrom)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Valid To</label>
            <p className="text-sm text-gray-900">{formatDate(agreement.validTo)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Created At</label>
            <p className="text-sm text-gray-900">{formatDate(agreement.createdAt)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Updated At</label>
            <p className="text-sm text-gray-900">{formatDate(agreement.updatedAt)}</p>
          </div>
        </div>

        {agreement.agent && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Agent Details</h4>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Company Name</label>
                  <p className="text-sm text-gray-900">{agreement.agent.companyName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{agreement.agent.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Type</label>
                  <p className="text-sm text-gray-900">{agreement.agent.type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <Badge variant={agreement.agent.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                    {agreement.agent.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {agreement.source && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Source Details</h4>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Company Name</label>
                  <p className="text-sm text-gray-900">{agreement.source.companyName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{agreement.source.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Type</label>
                  <p className="text-sm text-gray-900">{agreement.source.type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <Badge variant={agreement.source.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                    {agreement.source.status}
                  </Badge>
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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [confirmProceed, setConfirmProceed] = useState<null | { duplicate: boolean; message: string; payload: any }>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<{ agreementRef: string; agentId: string; sourceId: string; validFrom: string; validTo: string }>({ agreementRef: '', agentId: '', sourceId: '', validFrom: '', validTo: '' })

  const queryClient = useQueryClient()

  const { data: agreements, isLoading } = useQuery({
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
        >
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
        >
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
        >
          Expire
        </Button>
      )
    }
    
    return actions
  }

  const filteredAgreements = agreements?.data?.filter((agreement) => {
    const statusMatch = filterStatus === 'ALL' || agreement.status === filterStatus
    return statusMatch
  }) || []

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agreements Management</h1>
        <p className="mt-2 text-gray-600">
          Manage agreements between agents and sources
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Agreements</CardTitle>
          <div className="flex space-x-4 mt-4">
            <div className="flex-1">
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
            <div>
              <Button onClick={() => setIsCreateOpen(true)}>Create Agreement</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agreement Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgreements.map((agreement) => (
                  <tr key={agreement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {agreement.agreementRef}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agreement.agent?.companyName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agreement.source?.companyName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(agreement.status)}>
                        {agreement.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(agreement.validFrom)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(agreement.validTo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAgreementClick(agreement)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { /* placeholder */ }}
                        >
                          Impersonate agent
                        </Button>
                        {getAvailableActions(agreement)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Agreement Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Agreement">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Agreement Ref</label>
              <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={form.agreementRef} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, agreementRef: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Agent</label>
              <select className="mt-1 w-full border rounded px-3 py-2 text-sm" value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })}>
                <option value="">Select agent</option>
                {(agents?.data || []).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Source</label>
              <select className="mt-1 w-full border rounded px-3 py-2 text-sm" value={form.sourceId} onChange={(e) => setForm({ ...form, sourceId: e.target.value })}>
                <option value="">Select source</option>
                {(sources?.data || []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Valid From</label>
              <input type="datetime-local" className="mt-1 w-full border rounded px-3 py-2 text-sm" value={form.validFrom} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, validFrom: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Valid To</label>
              <input type="datetime-local" className="mt-1 w-full border rounded px-3 py-2 text-sm" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Confirmation */}
      <Modal isOpen={!!confirmProceed} onClose={() => setConfirmProceed(null)} title="Duplicate Agreement Detected">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">This agreement_ref already exists for this source/agent. Do you want to proceed?</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmProceed(null)}>Cancel</Button>
            <Button variant="danger" onClick={proceedCreate} loading={creating}>Proceed</Button>
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
