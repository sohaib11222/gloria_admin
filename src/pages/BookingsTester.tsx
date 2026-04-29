import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import http from '../lib/http'

export default function BookingsTester() {
  const [agentId, setAgentId] = useState('')
  const [limit, setLimit] = useState(100)

  const { data: agentsRes, isLoading: loadingAgents } = useQuery({
    queryKey: ['admin', 'companies', 'AGENT'],
    queryFn: async () => {
      const { data } = await http.get('/admin/companies', { params: { type: 'AGENT', limit: 500 } })
      return data
    },
  })
  const agents = Array.isArray(agentsRes?.items) ? agentsRes.items : Array.isArray(agentsRes) ? agentsRes : []

  const { data: bookingsRes, isLoading: loadingBookings, refetch } = useQuery({
    queryKey: ['admin', 'bookings', agentId, limit],
    queryFn: async () => {
      const params: any = { limit }
      if (agentId) params.company_id = agentId
      const { data } = await http.get('/bookings', { params })
      return data
    },
  })
  const items = Array.isArray(bookingsRes?.items) ? bookingsRes.items : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <p className="mt-2 text-gray-600">View bookings by agent and inspect booking status quickly.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Agent"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              options={[
                { value: '', label: loadingAgents ? 'Loading agents...' : 'All agents' },
                ...agents.map((a: any) => ({ value: a.id, label: `${a.companyName} (${a.email})` })),
              ]}
            />
            <Select
              label="Limit"
              value={String(limit)}
              onChange={(e) => setLimit(Number(e.target.value))}
              options={[
                { value: '50', label: '50' },
                { value: '100', label: '100' },
                { value: '200', label: '200' },
              ]}
            />
            <div className="flex items-end">
              <Button variant="secondary" onClick={() => refetch()} disabled={loadingBookings}>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bookings ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBookings ? (
            <Loader />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Booking ID</th>
                    <th className="text-left py-2">Agent</th>
                    <th className="text-left py-2">Source</th>
                    <th className="text-left py-2">Agreement</th>
                    <th className="text-left py-2">Supplier Ref</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((b: any) => (
                    <tr key={b.id} className="border-b border-gray-100">
                      <td className="py-2 font-mono text-xs">{b.id}</td>
                      <td className="py-2 font-mono text-xs">{b.agentId || '—'}</td>
                      <td className="py-2 font-mono text-xs">{b.sourceId || '—'}</td>
                      <td className="py-2">{b.agreementRef || '—'}</td>
                      <td className="py-2">{b.supplierBookingRef || '—'}</td>
                      <td className="py-2">
                        <Badge variant={(b.status || '').toUpperCase() === 'CANCELLED' ? 'danger' : (b.status || '').toUpperCase() === 'CONFIRMED' ? 'success' : 'warning'}>
                          {(b.status || 'PENDING').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-2">{b.createdAt ? new Date(b.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && <p className="text-gray-500 py-4">No bookings found.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
