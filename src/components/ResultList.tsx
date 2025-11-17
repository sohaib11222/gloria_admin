import React from 'react'
import { Badge } from './ui/Badge'

export function ResultList({ results }: { results: Array<{ name: string; status: string; duration_ms?: number; response?: any; note?: string }> }) {
  if (!results?.length) return null
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-800">{r.name}</div>
            <div className="flex items-center gap-2">
              <Badge variant={r.status === 'PASSED' ? 'success' : r.status === 'FAILED' ? 'danger' : 'default'} size="sm">
                {r.status}
              </Badge>
              {typeof r.duration_ms === 'number' && (
                <span className="text-xs text-gray-500">{r.duration_ms}ms</span>
              )}
            </div>
          </div>
          {(r.note || r.response) && (
            <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">{JSON.stringify(r.response ?? { note: r.note }, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  )
}





