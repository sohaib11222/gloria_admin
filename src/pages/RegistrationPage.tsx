import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '../state/useAppStore'
import { setAgentToken } from '../api/client'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import toast from 'react-hot-toast'

const AgentRegistrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  grpcAddress: z.string().min(1, 'gRPC Address is required'),
  httpUrl: z.string().url('Invalid HTTP URL'),
  agentToken: z.string().min(1, 'Agent Token is required'),
})

const SourceRegistrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  grpcAddress: z.string().min(1, 'gRPC Address is required'),
  httpUrl: z.string().url('Invalid HTTP URL'),
})

type AgentForm = z.infer<typeof AgentRegistrationSchema>
type SourceForm = z.infer<typeof SourceRegistrationSchema>

export default function RegistrationPage() {
  const navigate = useNavigate()
  const { setAddresses, state } = useAppStore()
  const [activeTab, setActiveTab] = useState<'agent' | 'source'>('agent')
  const [isSaving, setIsSaving] = useState(false)

  const agentForm = useForm<AgentForm>({
    resolver: zodResolver(AgentRegistrationSchema),
    defaultValues: {
      grpcAddress: state.addresses.agentGrpcAddr || 'localhost:51062',
      httpUrl: state.addresses.agentHttpUrl || 'http://localhost:9091',
    },
  })

  const sourceForm = useForm<SourceForm>({
    resolver: zodResolver(SourceRegistrationSchema),
    defaultValues: {
      grpcAddress: state.addresses.sourceGrpcAddr || 'localhost:51061',
      httpUrl: state.addresses.sourceHttpUrl || 'http://localhost:9090',
    },
  })

  const onAgentSubmit = async (data: AgentForm) => {
    setIsSaving(true)

    try {
      // Save agent token to server (with fallback to local)
      try {
        await setAgentToken(data.agentToken)
        toast.success('Agent token saved to server')
      } catch (error) {
        // Fallback to local storage
        localStorage.setItem('agent.token', data.agentToken)
        toast.success('Agent token saved locally (server persistence unavailable)')
      }

      // Save addresses
      setAddresses({
        agentGrpcAddr: data.grpcAddress,
        agentHttpUrl: data.httpUrl,
      })

      toast.success('Agent registration saved. These settings are used for admin tests.')
    } catch (error) {
      console.error('Failed to save agent registration:', error)
      toast.error('Failed to save agent registration')
    } finally {
      setIsSaving(false)
    }
  }

  const onSourceSubmit = async (data: SourceForm) => {
    setIsSaving(true)

    try {
      // Save addresses
      setAddresses({
        sourceGrpcAddr: data.grpcAddress,
        sourceHttpUrl: data.httpUrl,
      })

      toast.success('Source registration saved. These settings are used for admin tests.')
    } catch (error) {
      console.error('Failed to save source registration:', error)
      toast.error('Failed to save source registration')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Registration</h1>
          <p className="mt-2 text-gray-600">
            Configure your Agent and Source connections for testing
          </p>
        </div>

        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'agent'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Agent Registration
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'source'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Source Registration
          </button>
        </div>

        {activeTab === 'agent' && (
          <Card>
            <CardHeader>
              <CardTitle>Agent Registration</CardTitle>
              <p className="text-sm text-gray-600">
                Configure your Agent gRPC and HTTP connections
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={agentForm.handleSubmit(onAgentSubmit)} className="space-y-4">
                <Input
                  label="Agent Name"
                  placeholder="My Agent"
                  error={agentForm.formState.errors.name?.message}
                  {...agentForm.register('name')}
                />

                <Input
                  label="gRPC Address"
                  placeholder="localhost:51062"
                  error={agentForm.formState.errors.grpcAddress?.message}
                  {...agentForm.register('grpcAddress')}
                />

                <Input
                  label="HTTP URL"
                  placeholder="http://localhost:9091"
                  error={agentForm.formState.errors.httpUrl?.message}
                  {...agentForm.register('httpUrl')}
                />

                <Input
                  label="Agent Token"
                  type="password"
                  placeholder="Enter your agent token"
                  error={agentForm.formState.errors.agentToken?.message}
                  {...agentForm.register('agentToken')}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/connectivity')}
                    disabled={isSaving}
                  >
                    Skip
                  </Button>
                  <Button
                    type="submit"
                    loading={isSaving}
                  >
                    Save Token
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'source' && (
          <Card>
            <CardHeader>
              <CardTitle>Source Registration</CardTitle>
              <p className="text-sm text-gray-600">
                Configure your Source gRPC and HTTP connections
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={sourceForm.handleSubmit(onSourceSubmit)} className="space-y-4">
                <Input
                  label="Source Name"
                  placeholder="My Source"
                  error={sourceForm.formState.errors.name?.message}
                  {...sourceForm.register('name')}
                />

                <Input
                  label="gRPC Address"
                  placeholder="localhost:51061"
                  error={sourceForm.formState.errors.grpcAddress?.message}
                  {...sourceForm.register('grpcAddress')}
                />

                <Input
                  label="HTTP URL"
                  placeholder="http://localhost:9090"
                  error={sourceForm.formState.errors.httpUrl?.message}
                  {...sourceForm.register('httpUrl')}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/connectivity')}
                    disabled={isSaving}
                  >
                    Skip
                  </Button>
                  <Button
                    type="submit"
                    loading={isSaving}
                  >
                    Save
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
