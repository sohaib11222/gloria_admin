import React from 'react'
import { Badge } from './ui/Badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export function ResultList({ results }: { results: Array<{ name: string; status: string; duration_ms?: number; response?: any; note?: string; error?: string }> }) {
  if (!results?.length) return null
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <div key={i} className={`p-4 rounded-lg border ${
          r.status === 'PASSED' ? 'bg-green-50 border-green-200' : 
          r.status === 'FAILED' ? 'bg-red-50 border-red-200' : 
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {r.status === 'PASSED' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : r.status === 'FAILED' ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
              <div className="font-medium text-gray-900">{r.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={r.status === 'PASSED' ? 'success' : r.status === 'FAILED' ? 'danger' : 'default'} size="sm">
                {r.status}
              </Badge>
              {typeof r.duration_ms === 'number' && (
                <span className="text-xs text-gray-500">{r.duration_ms}ms</span>
              )}
            </div>
          </div>
          {r.error && (
            <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 font-mono">
              {r.error}
            </div>
          )}
          {r.note && !r.error && (
            <div className="mt-2 text-xs text-gray-600">{r.note}</div>
          )}
          {r.response && (
            <details className="mt-2">
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800 font-medium">
                View Response
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-60 border border-gray-200">
                {JSON.stringify(r.response, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ))}
    </div>
  )
}





