import React, { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import http from '../lib/http'

type BookingLogItem = {
  id?: string
  created_at?: string
  createdAt?: string
  request_id?: string
  requestId?: string
  company_id?: string
  companyId?: string
  source_id?: string
  sourceId?: string
  operation?: 'create' | 'cancel' | 'modify' | 'check'
  status?: string
  http_status?: number
  httpStatus?: number
  request?: any
  response?: any
}

export default function BookingLogs() {
  const [requestId, setRequestId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [operation, setOperation] = useState('')
  const [rows, setRows] = useState<BookingLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<BookingLogItem | null>(null)
  const [open, setOpen] = useState(false)

  const fetchLogs = useMutation({
    mutationFn: async () => {
      setLoading(true)
      try {
        const params: any = {}
        if (requestId.trim()) params.request_id = requestId.trim()
        if (companyId.trim()) params.company_id = companyId.trim()
        if (operation.trim()) params.operation = operation.trim()
        const { data } = await http.get('/bookings', { params })
        // Allow both {data: []} and [] shapes
        const items = (data?.data ?? data ?? []) as BookingLogItem[]
        setRows(Array.isArray(items) ? items : [])
        setLoading(false)
        return items
      } catch (error) {
        setRows([])
        setLoading(false)
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Request ID" placeholder="req_..." value={requestId} onChange={(e) => setRequestId(e.target.value)} />
            <Input label="Company ID" placeholder="agent company id" value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
            <Input label="Operation" placeholder="create | modify | cancel | check" value={operation} onChange={(e) => setOperation(e.target.value)} />
            <div className="flex items-end gap-2">
              <Button onClick={() => fetchLogs.mutate()} loading={loading}>Apply</Button>
              <Button variant="secondary" onClick={() => { setRequestId(''); setCompanyId(''); setOperation(''); fetchLogs.mutate() }}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleRows.map((r, idx) => {
                  const created = r.createdAt || r.created_at
                  const rid = r.requestId || r.request_id
                  const cid = r.companyId || r.company_id
                  const sid = r.sourceId || r.source_id
                  const op = r.operation || 'create'
                  const http = (r as any).httpStatus ?? (r as any).http_status
                  const statusVariant = http && http >= 200 && http < 300 ? 'success' : http ? 'danger' : 'warning'
                  return (
                    <tr key={r.id || rid || idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => openRow(r)}>
                      <td className="px-6 py-3 text-sm text-gray-700">{created ? new Date(created).toLocaleString() : '—'}</td>
                      <td className="px-6 py-3 text-sm font-mono text-gray-900">{rid?.slice(0, 12) || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{cid?.slice(0, 10) || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{sid?.slice(0, 10) || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{op}</td>
                      <td className="px-6 py-3 text-sm"><Badge variant={statusVariant as any}>{http ?? '—'}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {visibleRows.length === 0 && (
              <div className="text-center py-8 text-gray-500">No results</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Booking Log" size="xl">
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Request ID</div>
                <div className="font-mono text-gray-900">{selected.requestId || selected.request_id}</div>
              </div>
              <div>
                <div className="text-gray-500">Operation</div>
                <div className="text-gray-900">{selected.operation || 'create'}</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Request</div>
              <pre className="p-3 bg-gray-50 rounded border text-xs overflow-auto max-h-64">{JSON.stringify((selected as any).request ?? {}, null, 2)}</pre>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Response</div>
              <pre className="p-3 bg-gray-50 rounded border text-xs overflow-auto max-h-64">{JSON.stringify((selected as any).response ?? {}, null, 2)}</pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}


