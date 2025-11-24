import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { companiesApi } from '../api/companies'
import { agreementsApi } from '../api/agreements'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

export default function Agents() {
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => companiesApi.listAgents(),
  })

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
        <p className="mt-2 text-gray-600">
          Manage car rental agent companies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Companies</CardTitle>
        </CardHeader>
        <CardContent>
          {agents?.data && agents.data.length > 0 ? (
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
                  {agents.data.map((agent) => (
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
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleOfferAgreement(agent)}
                          disabled={agent.status !== 'ACTIVE'}
                        >
                          Offer Agreement
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No agents found</div>
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
    </div>
  )
}
