import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { logsApi } from '../api/logs'
import { formatDate } from '../lib/utils'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'

export default function Logs() {
  const [requestId, setRequestId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [selected, setSelected] = useState<any | null>(null)

  const endpoints = useMemo(() => ([
    { value: '', label: 'All endpoints' },
    { value: 'availability', label: 'availability' },
    { value: 'booking', label: 'booking' },
    { value: 'locations', label: 'locations' },
    { value: 'agreements', label: 'agreements' },
  ]), [])

  const { data: logs, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['logs', requestId, companyId, endpoint],
    queryFn: () => logsApi.listLogs({
      limit: 100,
      request_id: requestId || undefined as any,
      companyId: companyId || undefined,
      endpoint: endpoint || undefined,
    } as any),
  })

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs</h1>
          <p className="mt-2 text-gray-600">
            System logs and debugging information
          </p>
        </div>

        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Logs API is not available on this backend</p>
            <p className="text-sm text-gray-400 mt-2">
              Enable the logs endpoint to view system logs
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Logs</h1>
        <p className="mt-2 text-gray-600">
          System logs and debugging information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                label="Request ID"
                placeholder="req_..."
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Company ID"
                placeholder="company id"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              />
            </div>
            <div>
              <Select
                label="Endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                options={endpoints}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} loading={isFetching} className="w-full">Apply Filters</Button>
            </div>
          </div>
          {(requestId || companyId || endpoint) && (
            <div className="mt-3 text-sm text-gray-600">
              Filters applied. Click "Apply Filters" to refresh results.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results ({logs?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {logs?.data && logs.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agreement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.data.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(log)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(log.timestamp)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{log.requestId || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900 font-medium">{log.companyName || log.companyId || '-'}</div>
                        {log.companyCode && (
                          <div className="text-xs text-gray-500">{log.companyCode}</div>
                        )}
                        {log.companyType && (
                          <div className="text-xs text-gray-400">{log.companyType}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.sourceName || log.sourceId ? (
                          <>
                            <div className="text-gray-900 font-medium">{log.sourceName || log.sourceId}</div>
                            {log.sourceCode && (
                              <div className="text-xs text-gray-500">{log.sourceCode}</div>
                            )}
                            {log.sourceType && (
                              <div className="text-xs text-gray-400">{log.sourceType}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.agreementRef ? (
                          <span className="font-mono text-blue-600">{log.agreementRef}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.endpoint || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            log.http_status && log.http_status >= 400 ? 'danger' :
                            log.http_status && log.http_status >= 300 ? 'warning' : 'success'
                          }
                          size="sm"
                        >
                          {log.http_status || log.grpc_status || log.level || 'OK'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No logs available
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Log Details" size="lg">
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Time:</span> <span className="text-gray-900">{formatDate(selected.timestamp)}</span></div>
              <div><span className="text-gray-500">Request ID:</span> <span className="text-gray-900 font-mono">{selected.requestId || '-'}</span></div>
              <div>
                <span className="text-gray-500">Company:</span>
                <div className="mt-1">
                  <div className="text-gray-900 font-medium">{selected.companyName || selected.companyId || '-'}</div>
                  {selected.companyCode && <div className="text-xs text-gray-500">Code: {selected.companyCode}</div>}
                  {selected.companyType && <div className="text-xs text-gray-400">Type: {selected.companyType}</div>}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Source:</span>
                <div className="mt-1">
                  {selected.sourceName || selected.sourceId ? (
                    <>
                      <div className="text-gray-900 font-medium">{selected.sourceName || selected.sourceId}</div>
                      {selected.sourceCode && <div className="text-xs text-gray-500">Code: {selected.sourceCode}</div>}
                      {selected.sourceType && <div className="text-xs text-gray-400">Type: {selected.sourceType}</div>}
                    </>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Agreement:</span>
                <div className="mt-1">
                  {selected.agreementRef ? (
                    <span className="font-mono text-blue-600">{selected.agreementRef}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
              <div><span className="text-gray-500">Endpoint:</span> <span className="text-gray-900">{selected.endpoint || '-'}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="text-gray-900">{selected.http_status || selected.grpc_status || selected.level || 'OK'}</span></div>
              <div><span className="text-gray-500">Duration:</span> <span className="text-gray-900">{selected.duration_ms ? `${selected.duration_ms}ms` : '-'}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Request</h4>
                <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto max-h-80 border border-gray-200">
                  {typeof selected.maskedRequest === 'object' 
                    ? JSON.stringify(selected.maskedRequest, null, 2)
                    : selected.maskedRequest || selected.rawRequest || 'N/A'}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Response</h4>
                <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto max-h-80 border border-gray-200">
                  {typeof selected.maskedResponse === 'object'
                    ? JSON.stringify(selected.maskedResponse, null, 2)
                    : typeof selected.maskedResponse === 'string'
                    ? selected.maskedResponse
                    : JSON.stringify(selected.maskedResponse || selected.rawResponse || 'N/A', null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

