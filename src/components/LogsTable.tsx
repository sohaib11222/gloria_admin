import { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Loader } from './ui/Loader'
import { Modal } from './ui/Modal'

interface SystemLogEntry {
  id: string
  direction: string
  endpoint: string
  requestId: string
  companyId: string
  sourceId: string
  httpStatus: number | null
  grpcStatus: string | null
  maskedRequest: string
  maskedResponse: any
  durationMs: number
  createdAt: string
  status: string
  duration: string
  requestSize: number
  responseSize: number
}

interface LogsTableProps {
  logs: SystemLogEntry[]
  isLoading: boolean
}

export const LogsTable: React.FC<LogsTableProps> = ({ logs, isLoading }) => {
  const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewDetails = (log: SystemLogEntry) => {
    setSelectedLog(log)
    setIsModalOpen(true)
  }

  const formatJson = (jsonString: string) => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2)
    } catch {
      return jsonString
    }
  }

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
          <p className="text-sm text-gray-600">
            View system request/response logs and performance metrics
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Direction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {log.requestId.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.endpoint}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={log.direction === 'IN' ? 'info' : 'warning'}>
                          {log.direction}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge 
                            variant={
                              log.status === 'SUCCESS' ? 'success' : 
                              log.status === 'ERROR' ? 'danger' : 
                              'warning'
                            }
                          >
                            {log.status}
                          </Badge>
                          {log.httpStatus && (
                            <div className="text-xs text-gray-500">
                              HTTP: {log.httpStatus}
                            </div>
                          )}
                          {log.grpcStatus && (
                            <div className="text-xs text-gray-500">
                              gRPC: {log.grpcStatus}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.companyId.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.sourceId.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(log)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {logs.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500">
                    No logs found
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Details"
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Request ID</label>
                <p className="text-sm text-gray-900 font-mono">{selectedLog.requestId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Endpoint</label>
                <p className="text-sm text-gray-900">{selectedLog.endpoint}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Direction</label>
                <Badge variant={selectedLog.direction === 'IN' ? 'info' : 'warning'}>
                  {selectedLog.direction}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Badge 
                  variant={
                    selectedLog.status === 'SUCCESS' ? 'success' : 
                    selectedLog.status === 'ERROR' ? 'danger' : 
                    'warning'
                  }
                >
                  {selectedLog.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Duration</label>
                <p className="text-sm text-gray-900">{selectedLog.duration} ({selectedLog.durationMs}ms)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900">{new Date(selectedLog.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* IDs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Company ID</label>
                <p className="text-sm text-gray-900 font-mono">{selectedLog.companyId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Source ID</label>
                <p className="text-sm text-gray-900 font-mono">{selectedLog.sourceId}</p>
              </div>
            </div>

            {/* Status Codes */}
            {(selectedLog.httpStatus || selectedLog.grpcStatus) && (
              <div className="grid grid-cols-2 gap-4">
                {selectedLog.httpStatus && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">HTTP Status</label>
                    <p className="text-sm text-gray-900">{selectedLog.httpStatus}</p>
                  </div>
                )}
                {selectedLog.grpcStatus && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">gRPC Status</label>
                    <p className="text-sm text-gray-900">{selectedLog.grpcStatus}</p>
                  </div>
                )}
              </div>
            )}

            {/* Request/Response Data */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Request Data</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <pre className="text-xs text-gray-800 overflow-auto max-h-40">
                    {formatJson(selectedLog.maskedRequest)}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-1">Size: {selectedLog.requestSize} bytes</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Response Data</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <pre className="text-xs text-gray-800 overflow-auto max-h-40">
                    {typeof selectedLog.maskedResponse === 'string' 
                      ? formatJson(selectedLog.maskedResponse)
                      : JSON.stringify(selectedLog.maskedResponse, null, 2)
                    }
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-1">Size: {selectedLog.responseSize} bytes</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
