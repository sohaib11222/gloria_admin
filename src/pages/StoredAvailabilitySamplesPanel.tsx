import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Database, ChevronDown, ChevronUp, Car, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { availabilitySamplesApi, type AdminAvailabilitySampleItem } from '../api/availabilitySamples'
import { companiesApi } from '../api/companies'
import { formatDate } from '../lib/utils'

const PAGE_SIZE = 25

function coerceOfferRows(summary: unknown): Array<Record<string, unknown>> {
  if (summary == null) return []
  if (Array.isArray(summary)) {
    return summary.filter((x): x is Record<string, unknown> => x != null && typeof x === 'object' && !Array.isArray(x))
  }
  if (typeof summary === 'object' && summary !== null && 'offers' in summary) {
    const off = (summary as Record<string, unknown>).offers
    if (Array.isArray(off)) {
      return off.filter((x): x is Record<string, unknown> => x != null && typeof x === 'object' && !Array.isArray(x))
    }
  }
  return []
}

function pickStr(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k]
    if (v != null && String(v).trim() !== '') return String(v)
  }
  return ''
}

function OfferMiniCard({ offer }: { offer: Record<string, unknown> }) {
  const title =
    pickStr(offer, ['vehicle_make_model', 'makeModel', 'description', 'vehicleDescription', 'acriss', 'acrissCode']) ||
    'Vehicle offer'
  const vclass = pickStr(offer, ['vehicle_class', 'vehicleClass', 'group', 'category'])
  const price =
    offer.total_price ?? offer.totalPrice ?? offer.price ?? offer.estimatedTotalAmount ?? offer.amount
  const currency = pickStr(offer, ['currency', 'currencyCode']) || '—'
  const status = pickStr(offer, ['availability_status', 'status', 'availStatus'])
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="p-1.5 rounded bg-gray-100 shrink-0">
            <Car className="w-4 h-4 text-gray-700" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">{title}</div>
            {vclass ? <div className="text-xs text-gray-600 mt-0.5">{vclass}</div> : null}
          </div>
        </div>
        {status ? (
          <Badge variant={status.toUpperCase().includes('AVAILABLE') ? 'success' : 'warning'} className="shrink-0">
            {status}
          </Badge>
        ) : null}
      </div>
      {(price != null && price !== '') && (
        <div className="mt-2 text-base font-bold text-gray-900">
          {currency} {typeof price === 'number' ? price.toFixed(2) : String(price)}
        </div>
      )}
    </div>
  )
}

export function StoredAvailabilitySamplesPanel() {
  const [sourceId, setSourceId] = useState('')
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: sourcesRes } = useQuery({
    queryKey: ['admin', 'companies', 'sources-for-samples'],
    queryFn: () => companiesApi.listSources(),
  })

  const sources = sourcesRes?.data ?? []

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'availability-samples', sourceId, page],
    queryFn: () =>
      availabilitySamplesApi.list({
        sourceId: sourceId || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                <Database className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Stored availability and pricing samples</CardTitle>
                <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                  Each row is a snapshot a source stored from the Pricing tab (fetched availability or manual sample),
                  including vehicle and price fields when the supplier returned them.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              loading={isFetching}
              className="shrink-0"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <Select
              label="Source"
              value={sourceId}
              onChange={(e) => {
                setSourceId(e.target.value)
                setPage(0)
                setExpandedId(null)
              }}
              options={[
                { value: '', label: 'All sources' },
                ...sources.map((s) => ({
                  value: s.id,
                  label: `${s.companyName}${s.companyCode ? ` (${s.companyCode})` : ''}`,
                })),
              ]}
            />
          </div>

          {isLoading ? (
            <Loader className="py-16" />
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Failed to load samples. Check that you are authenticated as admin.
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-14 text-gray-500 text-sm">
              No stored samples yet. Sources create them from the source portal under Pricing (fetch or manual entry).
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Source</th>
                      <th className="py-2.5 px-3 font-medium">Pickup → return</th>
                      <th className="py-2.5 px-3 font-medium">When</th>
                      <th className="py-2.5 px-3 font-medium">Offers</th>
                      <th className="py-2.5 px-3 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row: AdminAvailabilitySampleItem) => {
                      const route =
                        [row.pickupLoc || row.pickupIso, row.returnLoc || row.returnIso]
                          .filter(Boolean)
                          .join(' → ') || '—'
                      const offers = coerceOfferRows(row.offersSummary)
                      const open = expandedId === row.id
                      return (
                        <React.Fragment key={row.id}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50/80">
                            <td className="py-2.5 px-3 align-top">
                              <div className="font-medium text-gray-900">{row.source.companyName}</div>
                              {row.source.companyCode ? (
                                <div className="text-xs text-gray-500 font-mono">{row.source.companyCode}</div>
                              ) : null}
                            </td>
                            <td className="py-2.5 px-3 align-top text-gray-700 max-w-xs">
                              <span className="line-clamp-2" title={route}>
                                {route}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 align-top text-gray-600 whitespace-nowrap text-xs">
                              {formatDate(row.updatedAt)}
                            </td>
                            <td className="py-2.5 px-3 align-top">
                              <Badge variant="info">{row.offersCount}</Badge>
                              {offers.length > 0 ? (
                                <span className="text-xs text-gray-500 ml-2">{offers.length} in summary</span>
                              ) : null}
                            </td>
                            <td className="py-2.5 px-3 align-top text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-gray-700"
                                onClick={() => setExpandedId(open ? null : row.id)}
                              >
                                {open ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                          {open && (
                            <tr className="bg-gray-50/90 border-b border-gray-100">
                              <td colSpan={5} className="p-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                      Criteria
                                    </div>
                                    <pre className="text-xs bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto font-mono">
                                      {JSON.stringify(row.criteria ?? {}, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                      Offer summary ({offers.length || row.offersCount} offers)
                                    </div>
                                    {offers.length > 0 ? (
                                      <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
                                        {offers.slice(0, 12).map((o, i) => (
                                          <OfferMiniCard key={i} offer={o} />
                                        ))}
                                        {offers.length > 12 && (
                                          <p className="text-xs text-gray-500 py-1">
                                            Showing 12 of {offers.length}; full JSON below.
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500 mb-2">
                                        No structured offer list in summary; see raw JSON.
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Raw offersSummary
                                  </div>
                                  <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto max-h-72 overflow-y-auto font-mono">
                                    {JSON.stringify(row.offersSummary, null, 2)}
                                  </pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {total > PAGE_SIZE && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!data?.hasMore}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
