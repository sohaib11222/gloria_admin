import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { transactionsApi, BillingTransaction } from '../api/billing'
import { formatDate } from '../lib/utils'
import { Receipt, RefreshCw, ExternalLink, FileText } from 'lucide-react'

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'default'> = {
  paid: 'success',
  open: 'warning',
  draft: 'default',
  uncollectible: 'default',
  void: 'default',
}

function formatAmount(cents: number, currency: string): string {
  const code = currency.toUpperCase() === 'EUR' ? 'EUR' : currency
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export default function TransactionsPage() {
  const [searchSource, setSearchSource] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: () => transactionsApi.listAdmin(),
  })

  const items: BillingTransaction[] = data?.items ?? []
  const filtered = searchSource.trim()
    ? items.filter(
        (t) =>
          (t.sourceName?.toLowerCase().includes(searchSource.toLowerCase())) ||
          (t.customerEmail?.toLowerCase().includes(searchSource.toLowerCase()))
      )
    : items

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="w-7 h-7" />
          Transactions
        </h1>
        <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>All billing transactions</CardTitle>
          <input
            type="text"
            placeholder="Search by source or email..."
            value={searchSource}
            onChange={(e) => setSearchSource(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader />
          ) : error ? (
            <p className="text-red-600 py-4">Failed to load transactions. Please try again.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Source</th>
                    <th className="text-left py-2">Plan</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-right py-2">Period</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">
                        {t.createdAt ? formatDate(t.createdAt) : '—'}
                      </td>
                      <td className="py-2">
                        <div className="font-medium">{t.sourceName ?? '—'}</div>
                        {t.customerEmail && (
                          <div className="text-gray-500 text-xs">{t.customerEmail}</div>
                        )}
                      </td>
                      <td className="py-2">{t.planName ?? '—'}</td>
                      <td className="py-2">
                        <Badge variant={STATUS_VARIANTS[t.status] ?? 'default'}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatAmount(t.amountPaid || t.amountDue, t.currency)}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {t.periodStart && t.periodEnd
                          ? `${formatDate(t.periodStart).split(' ')[0]} – ${formatDate(t.periodEnd).split(' ')[0]}`
                          : '—'}
                      </td>
                      <td className="py-2 text-right">
                        {t.hostedInvoiceUrl && (
                          <a
                            href={t.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </a>
                        )}
                        {t.invoicePdf && (
                          <a
                            href={t.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-gray-600 hover:underline ml-2"
                          >
                            <FileText className="w-4 h-4" />
                            PDF
                          </a>
                        )}
                        {!t.hostedInvoiceUrl && !t.invoicePdf && '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-gray-500 py-4">
                  {items.length === 0
                    ? 'No transactions yet. Transactions appear when sources pay for plans via Stripe.'
                    : 'No transactions match your search.'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
