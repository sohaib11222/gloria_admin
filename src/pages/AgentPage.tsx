import React, { useState, useEffect } from 'react'
import { useAppStore } from '../state/useAppStore'
import { 
  agentPing, 
  agentRunCheck, 
  getAgentToken, 
  setAgentToken, 
  deleteAgentToken 
} from '../api/client'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import toast from 'react-hot-toast'

interface TestResult {
  success: boolean
  message?: string
  responseTime?: number
  error?: string
}

interface AgentToken {
  token?: string
  expires_at?: string
}

export default function AgentPage() {
  const { state } = useAppStore()
  const [activeTab, setActiveTab] = useState<'ping' | 'runcheck' | 'token'>('ping')
  const [pingResult, setPingResult] = useState<TestResult | null>(null)
  const [runCheckResult, setRunCheckResult] = useState<TestResult | null>(null)
  const [isPinging, setIsPinging] = useState(false)
  const [isRunChecking, setIsRunChecking] = useState(false)
  const [agentToken, setAgentTokenState] = useState<AgentToken | null>(null)
  const [isLoadingToken, setIsLoadingToken] = useState(false)
  const [isSavingToken, setIsSavingToken] = useState(false)
  const [isDeletingToken, setIsDeletingToken] = useState(false)
  const [newToken, setNewToken] = useState('')
  const [wrapperAvailable, setWrapperAvailable] = useState<{
    ping?: boolean
    runCheck?: boolean
  }>({})

  useEffect(() => {
    loadAgentToken()
  }, [])

  const loadAgentToken = async () => {
    setIsLoadingToken(true)
    try {
      const token = await getAgentToken()
      setAgentTokenState(token)
    } catch (error) {
      console.error('Failed to load agent token:', error)
      // Check local storage as fallback
      const localToken = localStorage.getItem('agent.token')
      if (localToken) {
        setAgentTokenState({ token: localToken })
      }
    } finally {
      setIsLoadingToken(false)
    }
  }

  const testPing = async () => {
    setIsPinging(true)
    try {
      const result = await agentPing(state.addresses.agentGrpcAddr)
      setPingResult(result)
      setWrapperAvailable(prev => ({ ...prev, ping: result.success }))
      
      if (result.success) {
        toast.success('Agent ping successful')
      } else {
        toast.error('Agent ping failed')
      }
    } catch (error) {
      console.error('Ping test error:', error)
      toast.error('Ping test failed')
    } finally {
      setIsPinging(false)
    }
  }

  const testRunCheck = async () => {
    setIsRunChecking(true)
    try {
      const samplePayload = {
        test_data: 'sample',
        timestamp: new Date().toISOString(),
      }
      
      const result = await agentRunCheck(samplePayload, state.addresses.agentGrpcAddr)
      setRunCheckResult(result)
      setWrapperAvailable(prev => ({ ...prev, runCheck: result.success }))
      
      if (result.success) {
        toast.success('Agent run check successful')
      } else {
        toast.error('Agent run check failed')
      }
    } catch (error) {
      console.error('Run check test error:', error)
      toast.error('Run check test failed')
    } finally {
      setIsRunChecking(false)
    }
  }

  const saveToken = async () => {
    if (!newToken.trim()) {
      toast.error('Please enter a token')
      return
    }

    setIsSavingToken(true)
    try {
      await setAgentToken(newToken.trim())
      setNewToken('')
      await loadAgentToken()
      toast.success('Agent token saved')
    } catch (error) {
      console.error('Failed to save token:', error)
      toast.error('Failed to save token')
    } finally {
      setIsSavingToken(false)
    }
  }

  const removeToken = async () => {
    setIsDeletingToken(true)
    try {
      await deleteAgentToken()
      setAgentTokenState(null)
      toast.success('Agent token deleted')
    } catch (error) {
      console.error('Failed to delete token:', error)
      toast.error('Failed to delete token')
    } finally {
      setIsDeletingToken(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Testing</h1>
          <p className="mt-2 text-gray-600">
            Test Agent gRPC endpoints and manage tokens
          </p>
        </div>

        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('ping')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'ping'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Ping
          </button>
          <button
            onClick={() => setActiveTab('runcheck')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'runcheck'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Run Check
          </button>
          <button
            onClick={() => setActiveTab('token')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'token'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Token Management
          </button>
        </div>

        {activeTab === 'ping' && (
          <Card>
            <CardHeader>
              <CardTitle>Agent Ping</CardTitle>
              <p className="text-sm text-gray-600">
                Test basic connectivity to Agent gRPC service
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Address: {state.addresses.agentGrpcAddr || 'Not configured'}
                </div>

                {wrapperAvailable.ping === false && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm text-yellow-800">
                      <strong>Wrapper unavailable:</strong> Agent ping wrapper not available on server
                    </div>
                    <div className="mt-2 text-xs text-yellow-700">
                      You can still use the /admin/test/agent-grpc endpoint for testing
                    </div>
                  </div>
                )}

                <Button onClick={testPing} loading={isPinging} disabled={!state.addresses.agentGrpcAddr}>
                  Test Agent Ping
                </Button>

                {pingResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Result</span>
                      <Badge variant={pingResult.success ? 'success' : 'danger'}>
                        {pingResult.success ? 'SUCCESS' : 'FAILED'}
                      </Badge>
                    </div>
                    {pingResult.responseTime && (
                      <div className="text-sm text-gray-600">
                        Response time: {pingResult.responseTime}ms
                      </div>
                    )}
                    {pingResult.message && (
                      <div className="text-sm text-gray-600">
                        Message: {pingResult.message}
                      </div>
                    )}
                    {pingResult.error && (
                      <div className="text-sm text-red-600">
                        Error: {pingResult.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'runcheck' && (
          <Card>
            <CardHeader>
              <CardTitle>Agent Run Check</CardTitle>
              <p className="text-sm text-gray-600">
                Test Agent run check functionality with sample payload
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Address: {state.addresses.agentGrpcAddr || 'Not configured'}
                </div>

                {wrapperAvailable.runCheck === false && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm text-yellow-800">
                      <strong>Wrapper unavailable:</strong> Agent run check wrapper not available on server
                    </div>
                    <div className="mt-2 text-xs text-yellow-700">
                      You can still use the /admin/test/agent-grpc endpoint for testing
                    </div>
                  </div>
                )}

                <Button onClick={testRunCheck} loading={isRunChecking} disabled={!state.addresses.agentGrpcAddr}>
                  Test Agent Run Check
                </Button>

                {runCheckResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Result</span>
                      <Badge variant={runCheckResult.success ? 'success' : 'danger'}>
                        {runCheckResult.success ? 'SUCCESS' : 'FAILED'}
                      </Badge>
                    </div>
                    {runCheckResult.responseTime && (
                      <div className="text-sm text-gray-600">
                        Response time: {runCheckResult.responseTime}ms
                      </div>
                    )}
                    {runCheckResult.message && (
                      <div className="text-sm text-gray-600">
                        Message: {runCheckResult.message}
                      </div>
                    )}
                    {runCheckResult.error && (
                      <div className="text-sm text-red-600">
                        Error: {runCheckResult.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'token' && (
          <Card>
            <CardHeader>
              <CardTitle>Agent Token Management</CardTitle>
              <p className="text-sm text-gray-600">
                Manage Agent authentication tokens
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isLoadingToken ? (
                  <div className="flex justify-center py-4">
                    <Loader />
                  </div>
                ) : agentToken?.token ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-green-800">
                            Token is configured
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            {agentToken.token.substring(0, 8)}...
                          </div>
                          {agentToken.expires_at && (
                            <div className="text-xs text-green-600">
                              Expires: {new Date(agentToken.expires_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={removeToken}
                          loading={isDeletingToken}
                        >
                          Delete Token
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600 mb-3">
                        No agent token configured
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Set New Token</h4>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter agent token"
                      value={newToken}
                      onChange={(e) => setNewToken(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={saveToken}
                      loading={isSavingToken}
                      disabled={!newToken.trim()}
                    >
                      Save Token
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Note:</strong> If server persistence is unavailable, tokens will be stored locally only.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
