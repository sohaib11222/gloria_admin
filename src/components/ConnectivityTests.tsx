import { useState } from 'react'
import { useAppStore } from '../state/useAppStore'
import { 
  getUiConfig, 
  testSourceGrpc, 
  testAgentGrpc 
} from '../api/client'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Loader } from './ui/Loader'
import toast from 'react-hot-toast'

interface TestResult {
  success: boolean
  message?: string
  responseTime?: number
  error?: string
}

interface ConnectivityTestsProps {
  uiConfig: any
  healthStatus: any
  onConfigLoad: (config: any) => void
}

export const ConnectivityTests: React.FC<ConnectivityTestsProps> = ({ 
  uiConfig, 
  healthStatus, 
  onConfigLoad 
}) => {
  const { state } = useAppStore()
  const [sourceTest, setSourceTest] = useState<TestResult | null>(null)
  const [agentTest, setAgentTest] = useState<TestResult | null>(null)
  const [isTestingSource, setIsTestingSource] = useState(false)
  const [isTestingAgent, setIsTestingAgent] = useState(false)

  const testSourceConnection = async () => {
    setIsTestingSource(true)
    try {
      const result = await testSourceGrpc(state.addresses.sourceGrpcAddr)
      setSourceTest(result)
      
      if (result.success) {
        toast.success('Source gRPC test successful')
      } else {
        toast.error('Source gRPC test failed')
      }
    } catch (error) {
      console.error('Source test error:', error)
      toast.error('Source test failed')
    } finally {
      setIsTestingSource(false)
    }
  }

  const testAgentConnection = async () => {
    setIsTestingAgent(true)
    try {
      const result = await testAgentGrpc(state.addresses.agentGrpcAddr)
      setAgentTest(result)
      
      if (result.success) {
        toast.success('Agent gRPC test successful')
      } else {
        toast.error('Agent gRPC test failed')
      }
    } catch (error) {
      console.error('Agent test error:', error)
      toast.error('Agent test failed')
    } finally {
      setIsTestingAgent(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Middleware Health */}
      <Card>
        <CardHeader>
          <CardTitle>Middleware Health</CardTitle>
        </CardHeader>
        <CardContent>
          {healthStatus ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant="success">HEALTHY</Badge>
              </div>
              <div className="text-sm text-gray-600">
                Last checked: {new Date().toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Health check unavailable
            </div>
          )}
        </CardContent>
      </Card>

      {/* UI Config */}
      <Card>
        <CardHeader>
          <CardTitle>UI Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {uiConfig ? (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Features</h4>
                <div className="mt-1 flex flex-wrap gap-2">
                  {Object.entries(uiConfig.features || {}).map(([key, enabled]) => (
                    <Badge 
                      key={key} 
                      variant={enabled ? 'success' : 'default'}
                    >
                      {key}: {enabled ? 'ON' : 'OFF'}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {uiConfig.defaults && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Default Addresses</h4>
                  <div className="mt-1 text-xs text-gray-600 space-y-1">
                    {Object.entries(uiConfig.defaults).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Configuration unavailable
            </div>
          )}
        </CardContent>
      </Card>

      {/* gRPC Tests */}
      {state.features.grpcTesting !== false && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Source gRPC Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Address: {state.addresses.sourceGrpcAddr || 'Not configured'}
                </div>
                
                <Button
                  onClick={testSourceConnection}
                  loading={isTestingSource}
                  disabled={!state.addresses.sourceGrpcAddr}
                >
                  Test Source gRPC
                </Button>
                
                {sourceTest && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Result</span>
                      <Badge variant={sourceTest.success ? 'success' : 'danger'}>
                        {sourceTest.success ? 'SERVING' : 'FAILED'}
                      </Badge>
                    </div>
                    {sourceTest.responseTime && (
                      <div className="text-sm text-gray-600">
                        Response time: {sourceTest.responseTime}ms
                      </div>
                    )}
                    {sourceTest.error && (
                      <div className="text-sm text-red-600">
                        Error: {sourceTest.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent gRPC Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Address: {state.addresses.agentGrpcAddr || 'Not configured'}
                </div>
                
                <Button
                  onClick={testAgentConnection}
                  loading={isTestingAgent}
                  disabled={!state.addresses.agentGrpcAddr}
                >
                  Test Agent gRPC
                </Button>
                
                {agentTest && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Result</span>
                      <Badge variant={agentTest.success ? 'success' : 'danger'}>
                        {agentTest.success ? 'SERVING' : 'FAILED'}
                      </Badge>
                    </div>
                    {agentTest.responseTime && (
                      <div className="text-sm text-gray-600">
                        Response time: {agentTest.responseTime}ms
                      </div>
                    )}
                    {agentTest.error && (
                      <div className="text-sm text-red-600">
                        Error: {agentTest.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {state.features.grpcTesting === false && (
        <Card>
          <CardHeader>
            <CardTitle>gRPC Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              gRPC testing is disabled in the configuration.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
