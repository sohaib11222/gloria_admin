import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Loader } from '../components/ui/Loader'
import http from '../lib/http'
import toast from 'react-hot-toast'

type BookingLogItem = {
  id?: string
  created_at?: string
  createdAt?: string
  request_id?: string
  requestId?: string
  company_id?: string
  companyId?: string
  companyName?: string
  companyType?: string
  companyCode?: string
  source_id?: string
  sourceId?: string
  sourceName?: string
  sourceType?: string
  sourceCode?: string
  agreementRef?: string
  operation?: 'create' | 'cancel' | 'modify' | 'check'
  status?: string
  http_status?: number
  httpStatus?: number
  grpcStatus?: number
  request?: any
  response?: any
  durationMs?: number
}

export default function BookingLogs() {
  const [requestId, setRequestId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [agreementRef, setAgreementRef] = useState('')
  const [operation, setOperation] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [rows, setRows] = useState<BookingLogItem[]>([])
  const [selected, setSelected] = useState<BookingLogItem | null>(null)
  const [open, setOpen] = useState(false)

  // Fetch companies for dropdowns
  const { data: agentCompanies, isLoading: loadingAgents } = useQuery({
    queryKey: ['companies', 'AGENT'],
    queryFn: async () => {
      const { data } = await http.get('/admin/companies', { params: { type: 'AGENT' } })
      return data?.items || []
    },
  })

  const { data: sourceCompanies, isLoading: loadingSources } = useQuery({
    queryKey: ['companies', 'SOURCE'],
    queryFn: async () => {
      const { data } = await http.get('/admin/companies', { params: { type: 'SOURCE' } })
      return data?.items || []
    },
  })

  const fetchLogs = useMutation({
    mutationFn: async () => {
      try {
        const params: any = {}
        if (requestId.trim()) params.request_id = requestId.trim()
        if (companyId.trim()) params.company_id = companyId.trim()
        if (sourceId.trim()) params.source_id = sourceId.trim()
        if (agreementRef.trim()) params.agreement_ref = agreementRef.trim()
        if (operation.trim()) params.operation = operation.trim()
        if (fromDate) params.from_date = fromDate
        if (toDate) params.to_date = toDate
        params.limit = 200 // Increase default limit
        
        const { data } = await http.get('/admin/booking-logs', { params })
        // Response format: { items: [...], total: number }
        const items = (data?.items ?? []) as BookingLogItem[]
        setRows(Array.isArray(items) ? items : [])
        return items
      } catch (error: any) {
        setRows([])
        const errorMessage = error.response?.data?.message || 'Failed to fetch booking logs'
        console.error('Error fetching booking logs:', errorMessage)
        toast.error(errorMessage)
        throw error
      }
    },
  })

  useEffect(() => {
    fetchLogs.mutate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openRow = (r: BookingLogItem) => {
    setSelected(r)
    setOpen(true)
  }

  const visibleRows = useMemo(() => rows, [rows])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Booking Logs</h1>
        <p className="mt-2 text-gray-600">Inspect booking requests forwarded to sources and their responses.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input 
                label="Request ID" 
                placeholder="req_..." 
                value={requestId} 
                onChange={(e: any) => setRequestId(e.target.value)} 
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Company</label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  disabled={loadingAgents}
                >
                  <option value="">
                    {loadingAgents ? 'Loading agents...' : 'All Agents'}
                  </option>
                  {agentCompanies?.map((company: any) => (
                    <option key={company.id} value={company.id}>
                      {company.companyName} {company.companyCode ? `(${company.companyCode})` : `(${company.id.slice(0, 8)})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Company</label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  disabled={loadingSources}
                >
                  <option value="">
                    {loadingSources ? 'Loading sources...' : 'All Sources'}
                  </option>
                  {sourceCompanies?.map((company: any) => (
                    <option key={company.id} value={company.id}>
                      {company.companyName} {company.companyCode ? `(${company.companyCode})` : `(${company.id.slice(0, 8)})`}
                    </option>
                  ))}
                </select>
              </div>
              <Input 
                label="Agreement Reference" 
                placeholder="AG-REF-001" 
                value={agreementRef} 
                onChange={(e: any) => setAgreementRef(e.target.value)} 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                >
                  <option value="">All Operations</option>
                  <option value="create">Create</option>
                  <option value="modify">Modify</option>
                  <option value="cancel">Cancel</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="datetime-local"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={fromDate}
                  onChange={(e: any) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="datetime-local"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={toDate}
                  onChange={(e: any) => setToDate(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  onClick={() => {
                    fetchLogs.mutate()
                  }} 
                  loading={fetchLogs.isPending} 
                  className="flex-1"
                >
                  Apply
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => { 
                    setRequestId('')
                    setCompanyId('')
                    setSourceId('')
                    setAgreementRef('')
                    setOperation('')
                    setFromDate('')
                    setToDate('')
                    fetchLogs.mutate() 
                  }}
                  disabled={fetchLogs.isPending}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchLogs.isPending ? (
            <div className="flex justify-center items-center py-12">
              <Loader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agreement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No booking logs found. Try adjusting your filters or create a booking to see logs.
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((r, idx) => {
                      const created = r.createdAt || r.created_at
                      const rid = r.requestId || r.request_id
                      const cid = r.companyId || r.company_id
                      const cname = r.companyName
                      const ccode = r.companyCode
                      const sid = r.sourceId || r.source_id
                      const sname = r.sourceName
                      const scode = r.sourceCode
                      const op = r.operation || 'create'
                      const http = r.httpStatus ?? (r as any).http_status
                      const grpc = r.grpcStatus ?? (r as any).grpc_status
                      const statusVariant = http && http >= 200 && http < 300 ? 'success' : http && http >= 400 ? 'danger' : 'warning'
                      return (
                        <tr key={r.id || rid || idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => openRow(r)}>
                          <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {created ? new Date(created).toLocaleString() : '—'}
                          </td>
                          <td className="px-6 py-3 text-sm font-mono text-gray-900">
                            {rid ? (rid.length > 16 ? `${rid.slice(0, 16)}...` : rid) : '—'}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {cname ? (
                              <div>
                                <div className="text-gray-900 font-medium">{cname}</div>
                                {ccode && <div className="text-xs text-gray-500">{ccode}</div>}
                                {cid && <div className="text-xs text-gray-400 font-mono">{cid.slice(0, 8)}...</div>}
                              </div>
                            ) : cid ? (
                              <span className="text-gray-700 font-mono">{cid.length > 12 ? `${cid.slice(0, 12)}...` : cid}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {sname ? (
                              <div>
                                <div className="text-gray-900 font-medium">{sname}</div>
                                {scode && <div className="text-xs text-gray-500">{scode}</div>}
                                {sid && <div className="text-xs text-gray-400 font-mono">{sid.slice(0, 8)}...</div>}
                              </div>
                            ) : sid ? (
                              <span className="text-gray-700 font-mono">{sid.length > 12 ? `${sid.slice(0, 12)}...` : sid}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {r.agreementRef ? (
                              <span className="font-mono text-blue-600">{r.agreementRef}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <Badge variant={op === 'create' ? 'success' : op === 'cancel' ? 'danger' : op === 'modify' ? 'warning' : 'default'}>
                              {op}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <Badge variant={statusVariant as any}>
                              {http ? `HTTP ${http}` : grpc ? `gRPC ${grpc}` : '—'}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {r.durationMs ? `${r.durationMs}ms` : '—'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Booking Log Details" size="xl">
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Request ID</div>
                <div className="font-mono text-gray-900">{selected.requestId || selected.request_id || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Operation</div>
                <div className="text-gray-900">
                  <Badge variant={selected.operation === 'create' ? 'success' : selected.operation === 'cancel' ? 'danger' : selected.operation === 'modify' ? 'warning' : 'default'}>
                    {selected.operation || 'create'}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-gray-500">Agent Company</div>
                <div className="text-gray-900">
                  {selected.companyName ? (
                    <div>
                      <div className="font-medium">{selected.companyName}</div>
                      {selected.companyCode && <div className="text-xs text-gray-500">Code: {selected.companyCode}</div>}
                      {selected.companyType && <div className="text-xs text-gray-400">Type: {selected.companyType}</div>}
                      <div className="text-xs text-gray-400 font-mono mt-1">{selected.companyId || selected.company_id || '—'}</div>
                    </div>
                  ) : (
                    <div className="font-mono">{selected.companyId || selected.company_id || '—'}</div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Source Company</div>
                <div className="text-gray-900">
                  {selected.sourceName ? (
                    <div>
                      <div className="font-medium">{selected.sourceName}</div>
                      {selected.sourceCode && <div className="text-xs text-gray-500">Code: {selected.sourceCode}</div>}
                      {selected.sourceType && <div className="text-xs text-gray-400">Type: {selected.sourceType}</div>}
                      <div className="text-xs text-gray-400 font-mono mt-1">{selected.sourceId || selected.source_id || '—'}</div>
                    </div>
                  ) : (
                    <div className="font-mono">{selected.sourceId || selected.source_id || '—'}</div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Agreement Reference</div>
                <div className="text-gray-900">
                  {selected.agreementRef ? (
                    <span className="font-mono text-blue-600">{selected.agreementRef}</span>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className="text-gray-900">
                  {selected.httpStatus || (selected as any).http_status ? (
                    <Badge variant={selected.httpStatus && selected.httpStatus >= 200 && selected.httpStatus < 300 ? 'success' : selected.httpStatus && selected.httpStatus >= 400 ? 'danger' : 'warning'}>
                      HTTP {selected.httpStatus || (selected as any).http_status}
                    </Badge>
                  ) : selected.grpcStatus || (selected as any).grpc_status ? (
                    <Badge variant="warning">
                      gRPC {selected.grpcStatus || (selected as any).grpc_status}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Duration</div>
                <div className="text-gray-900">{selected.durationMs ? `${selected.durationMs}ms` : '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Created At</div>
                <div className="text-gray-900">
                  {(selected.createdAt || selected.created_at)
                    ? new Date(selected.createdAt || selected.created_at || '').toLocaleString()
                    : '—'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Request Payload</div>
                <pre className="p-3 bg-gray-50 rounded border border-gray-200 text-xs overflow-auto max-h-80 font-mono">
                  {typeof selected.request === 'object' 
                    ? JSON.stringify(selected.request, null, 2)
                    : selected.request || 'N/A'}
                </pre>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Response Payload</div>
                <pre className="p-3 bg-gray-50 rounded border border-gray-200 text-xs overflow-auto max-h-80 font-mono">
                  {typeof selected.response === 'object'
                    ? JSON.stringify(selected.response, null, 2)
                    : typeof selected.response === 'string'
                    ? selected.response
                    : selected.response || 'N/A'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}


