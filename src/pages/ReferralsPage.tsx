import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { referralsApi, ReferralLink } from '../api/referrals'
import toast from 'react-hot-toast'
import { Link2, Copy, Plus } from 'lucide-react'

/** Default public register pages (subdomains + Vite base paths /agent, /source). Override via env if needed. */
const DEFAULT_AGENT_REGISTER_PAGE = 'https://agent.gloriaconnect.com/agent/register'
const DEFAULT_SOURCE_REGISTER_PAGE = 'https://source.gloriaconnect.com/source/register'

function getRegisterPageUrls() {
  const agent =
    (import.meta.env.VITE_AGENT_REGISTER_URL as string | undefined)?.trim() || DEFAULT_AGENT_REGISTER_PAGE
  const source =
    (import.meta.env.VITE_SOURCE_REGISTER_URL as string | undefined)?.trim() || DEFAULT_SOURCE_REGISTER_PAGE
  return { agent, source }
}

function withReferralRef(registerPageUrl: string, slug: string): string {
  const u = new URL(registerPageUrl)
  u.searchParams.set('ref', slug)
  return u.href
}

function registerUrlExamples(slug: string) {
  const { agent: agentBase, source: sourceBase } = getRegisterPageUrls()
  const dev = !import.meta.env.PROD
  return {
    agent: withReferralRef(agentBase, slug),
    source: withReferralRef(sourceBase, slug),
    hint: dev
      ? 'Defaults target production agent/source hosts. For local testing, set VITE_AGENT_REGISTER_URL and VITE_SOURCE_REGISTER_URL in .env (full register page URL, no query).'
      : 'These are full registration URLs for agent.gloriaconnect.com and source.gloriaconnect.com (register, not login). Signups count when the referral is valid at registration.',
  }
}

export default function ReferralsPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [slug, setSlug] = useState('')
  const [label, setLabel] = useState('')
  const [restrict, setRestrict] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'referral-links'],
    queryFn: () => referralsApi.list(),
  })

  const items = data?.items ?? []

  const createMutation = useMutation({
    mutationFn: () =>
      referralsApi.create({
        slug,
        label: label.trim() || null,
        restrictToType: restrict === 'AGENT' || restrict === 'SOURCE' ? restrict : null,
      }),
    onSuccess: () => {
      toast.success('Referral link created')
      queryClient.invalidateQueries({ queryKey: ['admin', 'referral-links'] })
      setCreateOpen(false)
      setSlug('')
      setLabel('')
      setRestrict('')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create link'),
  })

  const patchMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { active?: boolean } }) => referralsApi.patch(id, body),
    onSuccess: () => {
      toast.success('Updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'referral-links'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Update failed'),
  })

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="w-7 h-7 text-blue-600" />
            Referral links
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Create a short code (slug) for marketing or partners. Share the Agent or Source registration URL with{' '}
            <code className="bg-gray-100 px-1 rounded text-sm">?ref=your-code</code>. New companies that complete
            registration with that code are counted here.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={() => setCreateOpen((v) => !v)} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          {createOpen ? 'Close form' : 'New referral link'}
        </Button>
      </div>

      {createOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Create referral link</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Slug is normalized to lowercase letters, numbers, and hyphens (e.g. <code className="bg-gray-50 px-1">summer-2026</code>).
            </p>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (in URL)</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. partner-jane" autoComplete="off" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label (optional, internal)</label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Q2 partner campaign" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restrict to account type</label>
              <Select
                value={restrict}
                onChange={(e) => setRestrict(e.target.value)}
                options={[
                  { value: '', label: 'Both Agent and Source' },
                  { value: 'AGENT', label: 'Agent only' },
                  { value: 'SOURCE', label: 'Source only' },
                ]}
              />
            </div>
            <Button type="button" variant="primary" onClick={() => createMutation.mutate()} disabled={!slug.trim() || createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All links</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader />
          ) : items.length === 0 ? (
            <p className="text-gray-500 py-6">No referral links yet. Create one to start tracking signups.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="py-2 pr-4">Slug</th>
                    <th className="py-2 pr-4">Label</th>
                    <th className="py-2 pr-4">Restrict</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Signups</th>
                    <th className="py-2 pr-4">Share</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row: ReferralLink) => (
                    <ReferralRow key={row.id} row={row} onCopy={copy} onToggleActive={(id, active) => patchMutation.mutate({ id, body: { active } })} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ReferralRow({
  row,
  onCopy,
  onToggleActive,
}: {
  row: ReferralLink
  onCopy: (t: string) => void
  onToggleActive: (id: string, active: boolean) => void
}) {
  const urls = useMemo(() => registerUrlExamples(row.slug), [row.slug])
  return (
    <tr className="border-b border-gray-100 align-top">
      <td className="py-3 pr-4 font-mono font-medium text-gray-900">{row.slug}</td>
      <td className="py-3 pr-4 text-gray-700">{row.label || '—'}</td>
      <td className="py-3 pr-4">
        {!row.restrictToType ? (
          <Badge variant="default">Both</Badge>
        ) : (
          <Badge variant="info">{row.restrictToType}</Badge>
        )}
      </td>
      <td className="py-3 pr-4">{row.active ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge>}</td>
      <td className="py-3 pr-4">
        <div className="font-semibold text-gray-900">{row.signupCount}</div>
        <div className="text-xs text-gray-500">
          Agent {row.signupsByType.AGENT} · Source {row.signupsByType.SOURCE}
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-col gap-1">
          <Button type="button" variant="secondary" size="sm" className="justify-start gap-1" onClick={() => onCopy(urls.agent)}>
            <Copy className="w-3.5 h-3.5" /> Agent URL
          </Button>
          <Button type="button" variant="secondary" size="sm" className="justify-start gap-1" onClick={() => onCopy(urls.source)}>
            <Copy className="w-3.5 h-3.5" /> Source URL
          </Button>
        </div>
        <p className="text-[11px] text-gray-500 mt-2 max-w-[14rem]">{urls.hint}</p>
      </td>
      <td className="py-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleActive(row.id, !row.active)}>
          {row.active ? 'Deactivate' : 'Activate'}
        </Button>
      </td>
    </tr>
  )
}
