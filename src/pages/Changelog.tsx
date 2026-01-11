import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { CheckCircle, Clock, Sparkles, Info } from 'lucide-react'

interface ChangelogEntry {
  version: string
  date: string
  status: 'released' | 'beta' | 'planned'
  highlights: string[]
  details: string[]
}

const changelogEntries: ChangelogEntry[] = [
  {
    version: 'v0.1',
    date: '2025-01',
    status: 'released',
    highlights: ['Echo/Ping Flow', 'Admin Platform', 'gRPC Submit/Poll Architecture'],
    details: [
      'Implemented submit → poll pattern with long polling (10s default)',
      'gRPC-based fan-out to multiple sources',
      'Request ID tracking and sequential response handling',
      'Admin dashboard with companies, agreements, and health monitoring',
      'Professional UI with sidebar navigation',
    ],
  },
  {
    version: 'v0.2',
    date: '2025-01',
    status: 'released',
    highlights: ['Agreements Management', 'UN/LOCODE Locations', 'Source Health & Backoff'],
    details: [
      'Source → Agent agreement flow (offer, accept, activate)',
      'UN/LOCODE-based location system with agreement overrides',
      'Strike-based source health with 15-minute initial backoff',
      'Automatic location syncing from sources',
      'Email notifications for agreement updates',
    ],
  },
  {
    version: 'v0.3',
    date: '2025-01',
    status: 'released',
    highlights: ['Availability Endpoint (OTA-style)', 'Booking Pass-through', 'API Documentation'],
    details: [
      'OTA-field naming for availability requests (PickupLocation, DropOffLocation, etc.)',
      'JSON and gRPC transport for availability',
      'Create, modify, cancel, check booking endpoints',
      'Role-based API docs (Admin, Agent, Source)',
      'Integrated docs viewer with code samples',
    ],
  },
  {
    version: 'v0.4',
    date: '2025-02',
    status: 'beta',
    highlights: ['IP Whitelisting', 'API Keys', 'Enhanced Logging'],
    details: [
      'IP whitelist management in admin',
      'API key generation and revocation',
      'System-wide activity audit log',
      'Notification center',
      'Command palette for quick navigation',
    ],
  },
  {
    version: 'v1.0',
    date: '2025-Q2',
    status: 'planned',
    highlights: ['ELK Integration', 'mTLS Support', 'Advanced Rate Limiting'],
    details: [
      'Centralized logging with Elasticsearch',
      'Mutual TLS authentication',
      'Per-company rate limits',
      'Advanced analytics dashboard',
      'Multi-tenant support',
    ],
  },
]

export default function Changelog() {
  const getStatusBadge = (status: ChangelogEntry['status']) => {
    switch (status) {
      case 'released':
        return { variant: 'success' as const, icon: CheckCircle, label: 'Released' }
      case 'beta':
        return { variant: 'warning' as const, icon: Clock, label: 'Beta' }
      case 'planned':
        return { variant: 'info' as const, icon: Sparkles, label: 'Planned' }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">What's New</h1>
        <p className="mt-2 text-gray-600">
          Version history and upcoming features
        </p>
      </div>

      {/* Current Version Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">v0.3 (Current)</h3>
                <Badge variant="success">Released</Badge>
              </div>
              <p className="text-gray-700 mb-4">
                Gloria Connect is production-ready for availability and booking flows with full admin oversight.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">OTA Integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">Health Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">API Documentation</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changelog Entries */}
      <div className="space-y-4">
        {changelogEntries.map((entry, idx) => {
          const statusInfo = getStatusBadge(entry.status)
          const StatusIcon = statusInfo.icon

          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      entry.status === 'released' ? 'bg-green-100' :
                      entry.status === 'beta' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <StatusIcon className={`h-5 w-5 ${
                        entry.status === 'released' ? 'text-green-600' :
                        entry.status === 'beta' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{entry.version}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{entry.date}</p>
                    </div>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Highlights</h4>
                  <div className="flex flex-wrap gap-2">
                    {entry.highlights.map((highlight, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Details</h4>
                  <ul className="space-y-2">
                    {entry.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Planned Features */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-600 rounded-xl">
              <Info className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Roadmap</h3>
              <p className="text-gray-700 mb-4">
                These features are planned for future releases based on production feedback and client requirements.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-700">ELK integration for centralized logging</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-700">Mutual TLS (mTLS) for enhanced security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-700">Advanced rate limiting per company</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-700">SDKs: Node.js, PHP, Python, Go</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

