import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { companiesApi, Company } from '../api/companies'
import { agreementsApi } from '../api/agreements'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

interface AgentFormModalProps {
  agent: Company | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const getInitialFormData = () => ({
  companyName: '',
  email: '',
  password: '',
  grpcEndpoint: '',
  status: 'ACTIVE' as 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED',
})

const AgentFormModal: React.FC<AgentFormModalProps> = ({ agent, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(getInitialFormData)

  useEffect(() => {
    if (isOpen) {
      if (agent) {
        // Edit mode: populate with agent data
        setFormData({
          companyName: agent.companyName || '',
          email: agent.email || '',
          password: '',
          grpcEndpoint: agent.grpcEndpoint || '',
          status: agent.status || 'ACTIVE',
        })
      } else {
        // Create mode: reset to empty defaults
        setFormData(getInitialFormData())
      }
    } else {
      // Reset form when modal closes
      setFormData(getInitialFormData())
    }
  }, [agent, isOpen])

  const createMutation = useMutation({
    mutationFn: (data: any) => companiesApi.createCompany(data),
    onSuccess: () => {
      toast.success('Agent created successfully')
      onSave()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create agent')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => companiesApi.updateCompanyDetails(id, data),
    onSuccess: () => {
      toast.success('Agent updated successfully')
      onSave()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update agent')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.companyName || !formData.email || (!agent && !formData.password)) {
      toast.error('Please fill in all required fields')
      return
    }

    const dataToSend: any = {
      companyName: formData.companyName,
      email: formData.email,
      type: 'AGENT',
      status: formData.status,
    }

    if (formData.password) {
      dataToSend.password = formData.password
    }

    if (formData.grpcEndpoint) {
      dataToSend.grpcEndpoint = formData.grpcEndpoint
    }

    if (agent) {
      updateMutation.mutate({ id: agent.id, data: dataToSend })
    } else {
      createMutation.mutate(dataToSend)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={agent ? 'Edit Agent' : 'Create Agent'}>
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
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!agent}
            helperText={agent ? 'Leave blank to keep current password' : undefined}
          />
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
        </div>

        <Input
          label="gRPC Endpoint (Optional)"
          placeholder="localhost:51062"
          value={formData.grpcEndpoint}
          onChange={(e) => setFormData({ ...formData, grpcEndpoint: e.target.value })}
          helperText="Format: host:port"
        />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {agent ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Agents() {
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [agentToEdit, setAgentToEdit] = useState<Company | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'>('ALL')
  const [form, setForm] = useState<{
    agreementRef: string
    sourceId: string
    validFrom: string
    validTo: string
  }>({
    agreementRef: '',
    sourceId: '',
    validFrom: '',
    validTo: '',
  })
  const [isCreating, setIsCreating] = useState(false)

  const queryClient = useQueryClient()

  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: () => companiesApi.listAgents(),
  })

  const filteredAgents = React.useMemo(() => {
    if (!agents?.data) return []
    return agents.data.filter((agent) => {
      const matchesSearch = !searchQuery || 
        agent.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'ALL' || agent.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [agents?.data, searchQuery, statusFilter])

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: () => companiesApi.listSources(),
  })

  const createAgreementMutation = useMutation({
    mutationFn: (data: any) => agreementsApi.createAgreement(data),
    onSuccess: () => {
      toast.success('Agreement created successfully')
      setIsModalOpen(false)
      setForm({ agreementRef: '', sourceId: '', validFrom: '', validTo: '' })
      setSelectedAgent(null)
      queryClient.invalidateQueries({ queryKey: ['agreements'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create agreement')
    },
  })

  const handleOfferAgreement = (agent: any) => {
    setSelectedAgent(agent)
    setForm({
      agreementRef: '',
      sourceId: '',
      validFrom: '',
      validTo: '',
    })
    setIsModalOpen(true)
  }

  const handleCreate = async () => {
    if (!form.agreementRef || !form.sourceId || !form.validFrom || !form.validTo) {
      toast.error('Please fill all required fields')
      return
    }

    if (!selectedAgent) {
      toast.error('Agent not selected')
      return
    }

    setIsCreating(true)
    try {
      // Check for duplicates first
      const dup = await agreementsApi.checkDuplicate({
        agreementRef: form.agreementRef,
        agentId: selectedAgent.id,
        sourceId: form.sourceId,
      })

      if (dup?.duplicate) {
        const proceed = window.confirm(
          'This agreement reference already exists for this agent/source combination. Do you want to proceed?'
        )
        if (!proceed) {
          setIsCreating(false)
          return
        }
      }

      await createAgreementMutation.mutateAsync({
        agreementRef: form.agreementRef,
        agentId: selectedAgent.id,
        sourceId: form.sourceId,
        validFrom: form.validFrom,
        validTo: form.validTo,
      })
    } catch (error: any) {
      // Error is already handled by mutation onError
      console.error('Failed to create agreement:', error)
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
          <p className="mt-2 text-gray-600">
            Manage car rental agent companies
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agent Companies ({filteredAgents.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ['agents'] })}>
                Refresh
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <Input
                label="Search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>
          {(searchQuery || statusFilter !== 'ALL') && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredAgents.length} of {agents?.data?.length || 0} agents
            </div>
          )}
        </CardHeader>
        <CardContent>
          {error ? (
            <ErrorDisplay error={error} title="Failed to load agents" />
          ) : filteredAgents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{agent.companyName}</div>
                          <div className="text-sm text-gray-500">{agent.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={agent.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {agent.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(agent.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handleOfferAgreement(agent)}
                            disabled={agent.status !== 'ACTIVE'}
                          >
                            Offer Agreement
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setAgentToEdit(agent)
                              setIsEditModalOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No agents found</div>
              {(searchQuery || statusFilter !== 'ALL') ? (
                <div className="text-sm text-gray-400 mb-4">
                  Try adjusting your filters or search query
                </div>
              ) : (
                <div className="text-sm text-gray-400 mb-4">
                  Get started by creating your first agent
                </div>
              )}
              {!searchQuery && statusFilter === 'ALL' && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offer Agreement Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAgent(null)
          setForm({ agreementRef: '', sourceId: '', validFrom: '', validTo: '' })
        }} 
        title="Offer Agreement"
        size="lg"
      >
        <div className="space-y-4">
          {selectedAgent && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">Agent:</p>
              <p className="text-sm text-blue-700">{selectedAgent.companyName} ({selectedAgent.email})</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agreement Reference <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., AG-REF-001"
                value={form.agreementRef}
                onChange={(e: any) => setForm({ ...form, agreementRef: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Company <span className="text-red-500">*</span>
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.sourceId}
                onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
              >
                <option value="">Select source</option>
                {(sources?.data || []).map((source: any) => (
                  <option key={source.id} value={source.id}>
                    {source.companyName} {source.status !== 'ACTIVE' ? `(${source.status})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid From <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid To <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsModalOpen(false)
                setSelectedAgent(null)
                setForm({ agreementRef: '', sourceId: '', validFrom: '', validTo: '' })
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              loading={isCreating}
              disabled={isCreating}
            >
              Create Agreement
            </Button>
          </div>
        </div>
      </Modal>

      <AgentFormModal
        key="create-agent-modal"
        agent={null}
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
        }}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['agents'] })
        }}
      />

      <AgentFormModal
        key={`edit-agent-modal-${agentToEdit?.id || 'new'}`}
        agent={agentToEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setAgentToEdit(null)
        }}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['agents'] })
        }}
      />
    </div>
  )
}
