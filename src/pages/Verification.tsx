import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { verificationApi } from '../api/verification'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { localSourceApi } from '../api/localSource'
import { localAgentApi } from '../api/localAgent'
import { safeParse, SourceHealthSchema, SourceLocationsSchema, SourceAvailabilitySchema, SourceBookingRefSchema, AgentHealthSchema, AgentTestSchema } from '../lib/localValidators'
import { useLocalStorage } from '../lib/useLocalStorage'
import { Input } from '../components/ui/Input'
import { adminTestApi } from '../api/adminTest'
import { ResultList } from '../components/ResultList'

export default function Verification() {
  const [sourceUrl, setSourceUrl] = useLocalStorage('local_source_url', import.meta.env.VITE_DEFAULT_SOURCE_URL || 'http://localhost:9090')
  const [agentUrl, setAgentUrl] = useLocalStorage('local_agent_url', import.meta.env.VITE_DEFAULT_AGENT_URL || 'http://localhost:9091')

  type TestResult = { name: string; status: 'PASSED' | 'FAILED' | 'PENDING'; duration_ms?: number; note?: string }
  type SourceTester = { id: string; url: string; runBooking: boolean; results: TestResult[]; running: boolean }
  type AgentTester = { id: string; url: string; trySearch: boolean; results: TestResult[]; running: boolean }

  const [sourceTesters, setSourceTesters] = useState<SourceTester[]>([
    { id: 'src-0', url: sourceUrl, runBooking: false, results: [], running: false },
  ])
  const [agentTesters, setAgentTesters] = useState<AgentTester[]>([
    { id: 'agt-0', url: agentUrl, trySearch: false, results: [], running: false },
  ])

  function updateSourceUrl(v: string) {
    setSourceUrl(v)
    setSourceTesters(prev => prev.map((t, i) => (i === 0 ? { ...t, url: v } : t)))
  }
  function updateAgentUrl(v: string) {
    setAgentUrl(v)
    setAgentTesters(prev => prev.map((t, i) => (i === 0 ? { ...t, url: v } : t)))
  }
  // Admin gRPC testers via middleware
  const { data: uiConfig } = useQuery({
    queryKey: ['ui-config'],
    queryFn: adminTestApi.getUiConfig,
  })

  const [sourceGrpc, setSourceGrpc] = useLocalStorage(
    'grpc_source_addr',
    import.meta.env.VITE_DEFAULT_SOURCE_GRPC_ADDR || uiConfig?.defaults?.sourceGrpcAddr || 'localhost:50061'
  )
  const [agentGrpc, setAgentGrpc] = useLocalStorage(
    'grpc_agent_addr',
    import.meta.env.VITE_DEFAULT_AGENT_GRPC_ADDR || uiConfig?.defaults?.agentGrpcAddr || 'localhost:50062'
  )

  const [srcGrpcRunBooking, setSrcGrpcRunBooking] = useState(false)
  const [srcGrpcResults, setSrcGrpcResults] = useState<any[]>([])
  const sourceGrpcTest = useMutation({
    mutationFn: (payload: any) => adminTestApi.testSourceGrpc(payload),
    onSuccess: (data) => setSrcGrpcResults(data?.results || []),
  })

  const [agtGrpcTrySearch, setAgtGrpcTrySearch] = useState(false)
  const [agtGrpcTryBook, setAgtGrpcTryBook] = useState(false)
  const [agtGrpcResults, setAgtGrpcResults] = useState<any[]>([])
  const agentGrpcTest = useMutation({
    mutationFn: (payload: any) => adminTestApi.testAgentGrpc(payload),
    onSuccess: (data) => setAgtGrpcResults(data?.results || []),
  })

  async function runSourceLocalTests(index: number) {
    try {
      setSourceTesters(prev => prev.map((t, i) => (i === index ? { ...t, running: true, results: [] } : t)))
      const tester = sourceTesters[index]
      const client = localSourceApi(tester.url)
      const steps: any[] = []

      // 1) health
      let t = performance.now()
      let data = await client.health().catch((e: any) => { throw { step: 'Health', err: e } })
      let ms = Math.round(performance.now() - t)
      const h = safeParse(SourceHealthSchema, data)
      steps.push({ name: 'Health', status: h.ok ? 'PASSED' : 'FAILED', duration_ms: ms, note: h.ok ? '' : 'Schema mismatch' })

      // 2) locations
      t = performance.now()
      data = await client.locations().catch((e: any) => { throw { step: 'Locations', err: e } })
      ms = Math.round(performance.now() - t)
      const loc = safeParse(SourceLocationsSchema, data)
      const nonEmpty = Array.isArray(data) && data.length > 0
      steps.push({ name: 'Locations', status: (loc.ok && nonEmpty) ? 'PASSED' : 'FAILED', duration_ms: ms, note: nonEmpty ? '' : 'Empty list' })

      // 3) availability
      t = performance.now()
      data = await client.availability({
        pickup_unlocode: 'GBMAN',
        dropoff_unlocode: 'GBGLA',
        pickup_iso: new Date().toISOString(),
        dropoff_iso: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      }).catch((e: any) => { throw { step: 'Availability', err: e } })
      ms = Math.round(performance.now() - t)
      const av = safeParse(SourceAvailabilitySchema, data)
      const hasItems = Array.isArray(data) && data.length > 0
      steps.push({ name: 'Availability', status: (av.ok && hasItems) ? 'PASSED' : 'FAILED', duration_ms: ms, note: hasItems ? '' : 'No results' })

      // 4) booking (optional)
      if (sourceTesters[index]?.runBooking) {
        // create
        t = performance.now()
        const created = await client.createBooking({ PickupLocation: 'GBMAN', DropOffLocation: 'GBGLA', VehicleClass: 'CDMR' })
          .catch((e: any) => { throw { step: 'Booking Create', err: e } })
        ms = Math.round(performance.now() - t)
        const cr = safeParse(SourceBookingRefSchema, created)
        const ref = created?.BookingReference
        steps.push({ name: 'Booking Create', status: (cr.ok && ref) ? 'PASSED' : 'FAILED', duration_ms: ms })

        if (ref) {
          // check
          t = performance.now()
          const checked = await client.checkBooking(ref).catch((e: any) => { throw { step: 'Booking Check', err: e } })
          ms = Math.round(performance.now() - t)
          steps.push({ name: 'Booking Check', status: (checked && checked.BookingReference === ref) ? 'PASSED' : 'FAILED', duration_ms: ms })

          // cancel
          t = performance.now()
          const cancelled = await client.cancelBooking({ BookingReference: ref }).catch((e: any) => { throw { step: 'Booking Cancel', err: e } })
          ms = Math.round(performance.now() - t)
          steps.push({ name: 'Booking Cancel', status: (cancelled && cancelled.BookingReference === ref) ? 'PASSED' : 'FAILED', duration_ms: ms })
        }
      }

      setSourceTesters(prev => prev.map((t, i) => (i === index ? { ...t, results: steps } : t)))
    } catch (e: any) {
      const step = e?.step || 'Unknown'
      setSourceTesters(prev => prev.map((t, i) => (i === index ? { ...t, results: [...t.results, { name: step, status: 'FAILED', note: e?.err?.message }] } : t)))
    } finally {
      setSourceTesters(prev => prev.map((t, i) => (i === index ? { ...t, running: false } : t)))
    }
  }

  async function runAgentLocalTests(index: number) {
    try {
      setAgentTesters(prev => prev.map((t, i) => (i === index ? { ...t, running: true, results: [] } : t)))
      const tester = agentTesters[index]
      const client = localAgentApi(tester.url)
      const steps: any[] = []

      // 1) health
      let t = performance.now()
      let data = await client.health().catch((e: any) => { throw { step: 'Agent Health', err: e } })
      let ms = Math.round(performance.now() - t)
      const ah = safeParse(AgentHealthSchema, data)
      const tk = (data && (data.tokenConfigured === true || data.tokenConfigured === false)) ? `tokenConfigured=${data.tokenConfigured}` : ''
      steps.push({ name: 'Agent Health', status: ah.ok ? 'PASSED' : 'FAILED', duration_ms: ms, note: tk })

      // 2) test
      t = performance.now()
      data = await client.test().catch((e: any) => { throw { step: 'Agent Test', err: e } })
      ms = Math.round(performance.now() - t)
      const at = safeParse(AgentTestSchema, data)
      steps.push({ name: 'Agent Test', status: at.ok ? 'PASSED' : 'FAILED', duration_ms: ms })

      // 3) optional /search
      if (agentTesters[index]?.trySearch) {
        t = performance.now()
        const s = await client.search({
          pickup_unlocode: 'GBMAN',
          dropoff_unlocode: 'GBGLA',
          pickup_iso: new Date().toISOString(),
          dropoff_iso: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        }).catch((e: any) => { throw { step: 'Agent Search', err: e } })
        ms = Math.round(performance.now() - t)
        steps.push({ name: 'Agent Search', status: (Array.isArray(s) || s?.request_id) ? 'PASSED' : 'FAILED', duration_ms: ms })
      }

      setAgentTesters(prev => prev.map((t, i) => (i === index ? { ...t, results: steps } : t)))
    } catch (e: any) {
      const step = e?.step || 'Unknown'
      setAgentTesters(prev => prev.map((t, i) => (i === index ? { ...t, results: [...t.results, { name: step, status: 'FAILED', note: e?.err?.message }] } : t)))
    } finally {
      setAgentTesters(prev => prev.map((t, i) => (i === index ? { ...t, running: false } : t)))
    }
  }
  const { data: status, isLoading } = useQuery({
    queryKey: ['verification-status'],
    queryFn: () => verificationApi.getVerificationStatus(),
  })

  const sourceVerificationMutation = useMutation({
    mutationFn: verificationApi.runSourceVerification,
    onSuccess: () => {
      toast.success('Source verification completed')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Source verification failed')
    },
  })

  const agentVerificationMutation = useMutation({
    mutationFn: verificationApi.runAgentVerification,
    onSuccess: () => {
      toast.success('Agent verification completed')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Agent verification failed')
    },
  })

  if (isLoading) {
    return <Loader className="min-h-96" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Verification</h1>
        <p className="mt-2 text-gray-600">
          Run verification tests for sources and agents
        </p>
      </div>

      {/* Local Sandbox Testers */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Local Sandbox Testers</h2>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setSourceTesters(prev => [...prev, { id: `src-${prev.length}`, url: sourceUrl, runBooking: false, results: [], running: false }])}
          >
            Add Source Tester
          </Button>
          <Button
            variant="secondary"
            onClick={() => setAgentTesters(prev => [...prev, { id: `agt-${prev.length}`, url: agentUrl, trySearch: false, results: [], running: false }])}
          >
            Add Agent Tester
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sourceTesters.map((t, i) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle>Local Source (Supplier) Tester #{i + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Source Base URL</label>
                  <Input value={t.url} onChange={(e: any) => setSourceTesters(prev => prev.map((p, idx) => idx === i ? { ...p, url: e.target.value } : p))} placeholder="http://localhost:9090" />
                  <p className="text-xs text-gray-500">Examples: /locations, /health, /availability, /booking/*</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={t.runBooking} onChange={(e) => setSourceTesters(prev => prev.map((p, idx) => idx === i ? { ...p, runBooking: e.target.checked } : p))} />
                    <span className="text-sm text-gray-700">Run booking test (create → check → cancel)</span>
                  </div>
                  <Button onClick={() => runSourceLocalTests(i)} loading={t.running} className="shrink-0">Run Source Local Tests</Button>
                </div>

                {t.results.length > 0 && (
                  <div className="space-y-3">
                    {t.results.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-800">{r.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant={r.status === 'PASSED' ? 'success' : 'danger'} size="sm">{r.status}</Badge>
                          {typeof r.duration_ms === 'number' && (<span className="text-xs text-gray-500">{r.duration_ms}ms</span>)}
                          {r.note && (<span className="text-xs text-gray-400">{r.note}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {agentTesters.map((t, i) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle>Local Agent Tester #{i + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Agent Base URL</label>
                  <Input value={t.url} onChange={(e: any) => setAgentTesters(prev => prev.map((p, idx) => idx === i ? { ...p, url: e.target.value } : p))} placeholder="http://localhost:9091" />
                  <p className="text-xs text-gray-500">Examples: /health, /test, /search, /book</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={t.trySearch} onChange={(e) => setAgentTesters(prev => prev.map((p, idx) => idx === i ? { ...p, trySearch: e.target.checked } : p))} />
                    <span className="text-sm text-gray-700">Try /search (requires AGENT_TOKEN in agent-backend)</span>
                  </div>
                  <Button onClick={() => runAgentLocalTests(i)} loading={t.running} className="shrink-0">Run Agent Local Tests</Button>
                </div>

                {t.results.length > 0 && (
                  <div className="space-y-3">
                    {t.results.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-800">{r.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant={r.status === 'PASSED' ? 'success' : 'danger'} size="sm">{r.status}</Badge>
                          {typeof r.duration_ms === 'number' && (<span className="text-xs text-gray-500">{r.duration_ms}ms</span>)}
                          {r.note && (<span className="text-xs text-gray-400">{r.note}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Admin gRPC Tests (via Middleware) */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Admin gRPC Tests (via Middleware)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Source gRPC Tester */}
          <Card>
            <CardHeader>
              <CardTitle>Source gRPC Tester</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Source gRPC address</label>
                <Input
                  value={sourceGrpc}
                  onChange={(e: any) => setSourceGrpc(e.target.value)}
                  placeholder="localhost:50061"
                />
                <p className="text-xs text-gray-500">Format: host:port or grpc://host:port</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={srcGrpcRunBooking} onChange={(e) => setSrcGrpcRunBooking(e.target.checked)} />
                  <span className="text-sm text-gray-700">Run booking cycle (create → check → cancel)</span>
                </div>
                <Button
                  onClick={() =>
                    sourceGrpcTest.mutate({
                      address: sourceGrpc,
                      availabilityPayload: {
                        pickup_unlocode: 'GBMAN',
                        dropoff_unlocode: 'GBGLA',
                        pickup_iso: new Date().toISOString(),
                        dropoff_iso: new Date(Date.now() + 2 * 86400000).toISOString(),
                      },
                      runBooking: srcGrpcRunBooking,
                    })
                  }
                  loading={sourceGrpcTest.isPending}
                >
                  Run Source gRPC Test
                </Button>
              </div>

              <ResultList results={srcGrpcResults} />
            </CardContent>
          </Card>

          {/* Agent gRPC Tester */}
          <Card>
            <CardHeader>
              <CardTitle>Agent gRPC Tester</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Agent gRPC address</label>
                <Input
                  value={agentGrpc}
                  onChange={(e: any) => setAgentGrpc(e.target.value)}
                  placeholder="localhost:50062"
                />
                <p className="text-xs text-gray-500">Format: host:port or grpc://host:port</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={agtGrpcTrySearch} onChange={(e) => setAgtGrpcTrySearch(e.target.checked)} />
                  <span className="text-sm text-gray-700">Try RunSearch (requires Agent token configured)</span>
                </div>
                <Button
                  onClick={() =>
                    agentGrpcTest.mutate({
                      address: agentGrpc,
                      ...(agtGrpcTrySearch
                        ? {
                            searchPayload: {
                              pickup_unlocode: 'GBMAN',
                              dropoff_unlocode: 'GBGLA',
                              pickup_iso: new Date().toISOString(),
                              dropoff_iso: new Date(Date.now() + 2 * 86400000).toISOString(),
                            },
                          }
                        : {}),
                      ...(agtGrpcTryBook
                        ? {
                            bookPayload: {
                              agreement_ref: 'AG-LOCAL-001',
                              pickup_unlocode: 'GBMAN',
                              dropoff_unlocode: 'GBGLA',
                              vehicle_class: 'CDMR',
                            },
                          }
                        : {}),
                    })
                  }
                  loading={agentGrpcTest.isPending}
                >
                  Run Agent gRPC Test
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={agtGrpcTryBook} onChange={(e) => setAgtGrpcTryBook(e.target.checked)} />
                <span className="text-sm text-gray-700">Also test RunBook (idempotency via middleware)</span>
              </div>

              <ResultList results={agtGrpcResults} />
            </CardContent>
          </Card>

        </div>
      </div>

      {/* `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Source Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Run comprehensive verification tests for all source companies
            </p>
            <Button
              onClick={() => sourceVerificationMutation.mutate()}
              loading={sourceVerificationMutation.isPending}
              className="w-full"
            >
              Run Source Verification
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Run verification tests for all agent companies
            </p>
            <Button
              onClick={() => agentVerificationMutation.mutate()}
              loading={agentVerificationMutation.isPending}
              className="w-full"
            >
              Run Agent Verification
            </Button>
          </CardContent>
        </Card>
      </div>` */}

      {status?.report && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Verification Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {status.report.test_results.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{test.name}</h4>
                    {test.description && (
                      <p className="text-sm text-gray-600">{test.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {test.status === 'PASSED' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : test.status === 'FAILED' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <Badge
                      variant={test.status === 'PASSED' ? 'success' : 'danger'}
                      size="sm"
                    >
                      {test.status}
                    </Badge>
                    {test.duration_ms && (
                      <span className="text-xs text-gray-500">
                        {test.duration_ms}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
