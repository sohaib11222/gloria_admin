import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Loader } from '../components/ui/Loader'
import {
  billingApi,
  agentBillingApi,
  Plan,
  PlanInterval,
  SourceSubscription,
  SubscriptionStatus,
  CreatePlanBody,
  UpdatePlanBody,
  SetSourceSubscriptionBody,
  AgentPlan,
  AgentSubscription,
  CreateAgentPlanBody,
  UpdateAgentPlanBody,
  SetAgentSubscriptionBody,
  AgentPlanCountryPrice,
} from '../api/billing'
import { companiesApi, Company } from '../api/companies'
import http from '../lib/http'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'
import { CreditCard, Plus, Edit, Settings, MapPin, Building2, Infinity, Users } from 'lucide-react'

const INTERVAL_LABELS: Record<PlanInterval, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Active',
  canceled: 'Canceled',
  past_due: 'Past Due',
  trialing: 'Trialing',
}

const STATUS_VARIANTS: Record<SubscriptionStatus, 'success' | 'default' | 'warning' | 'info'> = {
  active: 'success',
  canceled: 'default',
  past_due: 'warning',
  trialing: 'info',
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

/** Plain EUR string for admin text fields (e.g. 6.5, not cents). */
function formatEurInputFromCents(cents: number): string {
  if (!Number.isFinite(cents)) return ''
  const euros = Math.round(cents) / 100
  if (Number.isInteger(euros)) return String(euros)
  const rounded = Math.round(euros * 10_000) / 10_000
  return String(rounded).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

/** Accepts "6.5", "6,5", "10.25". Returns integer cents or null if invalid. */
function parseEurAmountToCents(raw: string): number | null {
  const s = raw.trim().replace(/,/g, '.')
  if (s === '') return null
  const euros = Number(s)
  if (!Number.isFinite(euros) || euros < 0) return null
  return Math.round(euros * 100)
}

function planEffectivePriceCents(plan: Pick<Plan, 'amountCents' | 'pricePerBranchCents'>): number {
  const per = plan.pricePerBranchCents ?? 0
  return per > 0 ? per : plan.amountCents
}

type BillingTab = 'source' | 'agent'

export default function BillingPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<BillingTab>('source')
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<Company | null>(null)
  const [selectedSub, setSelectedSub] = useState<SourceSubscription | null>(null)
  const [subForm, setSubForm] = useState({
    planId: '',
    subscribedBranchCount: 1,
    status: 'active' as SubscriptionStatus,
    currentPeriodEnd: '',
  })
  const [planForm, setPlanForm] = useState<CreatePlanBody>({
    name: '',
    interval: 'MONTHLY',
    amountCents: 0,
    pricePerBranchCents: 500,
    branchLimit: 0,
  })
  /** Single EUR field in plan modal; both amountCents and pricePerBranchCents are set from this on save. */
  const [planPriceEurInput, setPlanPriceEurInput] = useState('')

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => billingApi.listPlans(),
  })
  const plans = plansData?.items ?? []

  const { data: sourcesWithSubs, isLoading: sourcesLoading } = useQuery({
    queryKey: ['admin', 'companies', 'SOURCE', 'subscriptions'],
    queryFn: async () => {
      const res = await http.get('/admin/companies', { params: { type: 'SOURCE', limit: 500 } })
      const sourcesList: Company[] = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : []
      const subs: Record<string, SourceSubscription | null> = {}
      await Promise.all(
        sourcesList.slice(0, 100).map(async (s) => {
          try {
            const sub = await billingApi.getSourceSubscription(s.id)
            subs[s.id] = sub
          } catch {
            subs[s.id] = null
          }
        })
      )
      return { sources: sourcesList, subscriptionsBySource: subs }
    },
  })
  const sources: Company[] = sourcesWithSubs?.sources ?? []
  const subscriptionsBySource: Record<string, SourceSubscription | null> = sourcesWithSubs?.subscriptionsBySource ?? {}

  // Agent billing state
  const [agentPlanModalOpen, setAgentPlanModalOpen] = useState(false)
  const [editingAgentPlan, setEditingAgentPlan] = useState<AgentPlan | null>(null)
  const [agentPlanForm, setAgentPlanForm] = useState<CreateAgentPlanBody>({
    name: '',
    interval: 'MONTHLY',
    branchLimit: 0,
    defaultPriceCents: 500,
  })
  const [countryPrices, setCountryPrices] = useState<Array<{ countryCode: string; pricePerBranchCents: number }>>([])
  const [agentSubscriptionModalOpen, setAgentSubscriptionModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Company | null>(null)
  const [selectedAgentSub, setSelectedAgentSub] = useState<(AgentSubscription & { effectiveBranchCount?: number }) | null>(null)
  const [agentSubForm, setAgentSubForm] = useState({
    planId: '',
    subscribedBranchCount: 1,
    status: 'active' as SubscriptionStatus,
    currentPeriodEnd: '',
  })

  const { data: agentPlansData, isLoading: agentPlansLoading } = useQuery({
    queryKey: ['admin', 'agent-plans'],
    queryFn: () => agentBillingApi.listAgentPlans(),
    enabled: activeTab === 'agent',
  })
  const agentPlans = agentPlansData?.items ?? []

  const { data: agentsRes, isLoading: agentsLoading } = useQuery({
    queryKey: ['admin', 'companies', 'AGENT'],
    queryFn: async () => {
      const res = await http.get('/admin/companies', { params: { type: 'AGENT', limit: 500 } })
      return res.data
    },
    enabled: activeTab === 'agent',
  })
  const agents: Company[] = Array.isArray(agentsRes?.items) ? agentsRes.items : Array.isArray(agentsRes) ? agentsRes : []
  const [agentSubsByAgent, setAgentSubsByAgent] = useState<Record<string, (AgentSubscription & { effectiveBranchCount?: number }) | null>>({})
  const [agentSubsVersion, setAgentSubsVersion] = useState(0)
  useEffect(() => {
    if (activeTab !== 'agent' || agents.length === 0) return
    let cancelled = false
    const subs: Record<string, (AgentSubscription & { effectiveBranchCount?: number }) | null> = {}
    Promise.all(
      agents.slice(0, 100).map(async (a) => {
        try {
          const data = await agentBillingApi.getAgentSubscription(a.id) as any
          if (cancelled) return
          if (data.subscription === null) subs[a.id] = null
          else if (data.id && data.agentId) subs[a.id] = data
          else subs[a.id] = null
        } catch {
          if (!cancelled) subs[a.id] = null
        }
      })
    ).then(() => { if (!cancelled) setAgentSubsByAgent(subs) })
    return () => { cancelled = true }
  }, [activeTab, agents.length, agentSubsVersion])

  const createPlanMutation = useMutation({
    mutationFn: (body: CreatePlanBody) => billingApi.createPlan(body),
    onSuccess: () => {
      toast.success('Plan created')
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      setPlanModalOpen(false)
      setPlanForm({ name: '', interval: 'MONTHLY', amountCents: 0, pricePerBranchCents: 500, branchLimit: 0 })
      setPlanPriceEurInput(formatEurInputFromCents(500))
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create plan'),
  })

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePlanBody }) => billingApi.updatePlan(id, body),
    onSuccess: () => {
      toast.success('Plan updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      setPlanModalOpen(false)
      setEditingPlan(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update plan'),
  })

  const setSubscriptionMutation = useMutation({
    mutationFn: ({ sourceId, body }: { sourceId: string; body: SetSourceSubscriptionBody }) =>
      billingApi.setSourceSubscription(sourceId, body),
    onSuccess: () => {
      toast.success('Subscription updated')
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      setSubscriptionModalOpen(false)
      setSelectedSource(null)
      setSelectedSub(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update subscription'),
  })

  const createAgentPlanMutation = useMutation({
    mutationFn: ({ body, prices }: { body: CreateAgentPlanBody; prices: Array<{ countryCode: string; pricePerBranchCents: number }> }) =>
      agentBillingApi.createAgentPlan(body).then(async (plan) => {
        if (prices.length > 0) {
          await agentBillingApi.setAgentPlanCountryPrices(plan.id, { prices: prices.map(p => ({ ...p, stripePriceId: null })) })
        }
        return plan
      }),
    onSuccess: () => {
      toast.success('Agent plan created')
      queryClient.invalidateQueries({ queryKey: ['admin', 'agent-plans'] })
      setAgentPlanModalOpen(false)
      setAgentPlanForm({ name: '', interval: 'MONTHLY', branchLimit: 0, defaultPriceCents: 500 })
      setCountryPrices([])
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create agent plan'),
  })
  const updateAgentPlanMutation = useMutation({
    mutationFn: async ({ id, body, prices }: { id: string; body: UpdateAgentPlanBody; prices?: Array<{ countryCode: string; pricePerBranchCents: number }> }) => {
      await agentBillingApi.updateAgentPlan(id, body)
      if (prices && prices.length > 0) {
        await agentBillingApi.setAgentPlanCountryPrices(id, { prices: prices.map(p => ({ ...p, stripePriceId: null })) })
      }
    },
    onSuccess: () => {
      toast.success('Agent plan updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'agent-plans'] })
      setAgentPlanModalOpen(false)
      setEditingAgentPlan(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update agent plan'),
  })
  const setAgentSubscriptionMutation = useMutation({
    mutationFn: ({ agentId, body }: { agentId: string; body: SetAgentSubscriptionBody }) =>
      agentBillingApi.setAgentSubscription(agentId, body),
    onSuccess: () => {
      toast.success('Agent subscription updated')
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies', 'AGENT'] })
      setAgentSubsVersion((v) => v + 1)
      setAgentSubscriptionModalOpen(false)
      setSelectedAgent(null)
      setSelectedAgentSub(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update agent subscription'),
  })

  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan)
    const effective = planEffectivePriceCents(plan)
    setPlanForm({
      name: plan.name,
      interval: plan.interval,
      amountCents: plan.amountCents,
      pricePerBranchCents: plan.pricePerBranchCents ?? plan.amountCents,
      branchLimit: plan.branchLimit ?? 0,
    })
    setPlanPriceEurInput(formatEurInputFromCents(effective))
    setPlanModalOpen(true)
  }

  const openCreatePlan = () => {
    setEditingPlan(null)
    setPlanForm({ name: '', interval: 'MONTHLY', amountCents: 0, pricePerBranchCents: 500, branchLimit: 0 })
    setPlanPriceEurInput(formatEurInputFromCents(500))
    setPlanModalOpen(true)
  }

  const handleSavePlan = () => {
    const cents = parseEurAmountToCents(planPriceEurInput)
    if (cents === null) {
      toast.error('Enter a valid price in EUR (e.g. 6.5 or 10.25)')
      return
    }
    const payload: CreatePlanBody = {
      ...planForm,
      amountCents: cents,
      pricePerBranchCents: cents,
    }
    if (editingPlan) {
      const prevEffective = planEffectivePriceCents(editingPlan)
      const pricingChanged = cents !== prevEffective || planForm.interval !== editingPlan.interval
      updatePlanMutation.mutate({
        id: editingPlan.id,
        body: {
          name: payload.name,
          interval: payload.interval,
          amountCents: payload.amountCents,
          pricePerBranchCents: payload.pricePerBranchCents,
          branchLimit: payload.branchLimit,
          // Drop cached Stripe price so checkout recreates an EUR price for the new per-branch amount / interval.
          ...(pricingChanged && editingPlan.stripePriceId ? { stripePriceId: null as null } : {}),
        },
      })
    } else {
      createPlanMutation.mutate(payload)
    }
  }

  const openEditSubscription = (source: Company) => {
    const sub = subscriptionsBySource[source.id]
    setSelectedSource(source)
    setSelectedSub(sub ?? null)
    setSubForm({
      planId: sub?.planId || (plans[0]?.id ?? ''),
      subscribedBranchCount: sub?.subscribedBranchCount ?? 1,
      status: sub?.status ?? 'active',
      currentPeriodEnd: sub?.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd).toISOString().slice(0, 16)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    })
    setSubscriptionModalOpen(true)
  }

  const handleSaveSubscription = () => {
    if (!selectedSource || !subForm.planId) return
    const body: SetSourceSubscriptionBody = {
      planId: subForm.planId,
      subscribedBranchCount: subForm.subscribedBranchCount,
      status: subForm.status,
    }
    if (subForm.currentPeriodEnd) {
      body.currentPeriodEnd = new Date(subForm.currentPeriodEnd).toISOString()
    }
    setSubscriptionMutation.mutate({
      sourceId: selectedSource.id,
      body,
    })
  }

  const openCreateAgentPlan = () => {
    setEditingAgentPlan(null)
    setAgentPlanForm({ name: '', interval: 'MONTHLY', branchLimit: 0, defaultPriceCents: 500 })
    setCountryPrices([])
    setAgentPlanModalOpen(true)
  }
  const openEditAgentPlan = (plan: AgentPlan) => {
    setEditingAgentPlan(plan)
    setAgentPlanForm({
      name: plan.name,
      interval: plan.interval,
      branchLimit: plan.branchLimit,
      defaultPriceCents: plan.defaultPriceCents,
    })
    setCountryPrices((plan.countryPrices ?? []).map(p => ({ countryCode: p.countryCode, pricePerBranchCents: p.pricePerBranchCents })))
    setAgentPlanModalOpen(true)
  }
  const handleSaveAgentPlan = () => {
    if (editingAgentPlan) {
      updateAgentPlanMutation.mutate({
        id: editingAgentPlan.id,
        body: { name: agentPlanForm.name, interval: agentPlanForm.interval, branchLimit: agentPlanForm.branchLimit, defaultPriceCents: agentPlanForm.defaultPriceCents },
        prices: countryPrices,
      })
    } else {
      createAgentPlanMutation.mutate({ body: agentPlanForm, prices: countryPrices })
    }
  }
  const openEditAgentSubscription = (agent: Company) => {
    const sub = agentSubsByAgent[agent.id]
    setSelectedAgent(agent)
    setSelectedAgentSub(sub ?? null)
    setAgentSubForm({
      planId: sub?.agentPlanId ?? agentPlans[0]?.id ?? '',
      subscribedBranchCount: sub?.subscribedBranchCount ?? 1,
      status: (sub?.status ?? 'active') as SubscriptionStatus,
      currentPeriodEnd: sub?.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd).toISOString().slice(0, 16)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    })
    setAgentSubscriptionModalOpen(true)
  }
  const handleSaveAgentSubscription = () => {
    if (!selectedAgent || !agentSubForm.planId) return
    const body: SetAgentSubscriptionBody = {
      planId: agentSubForm.planId,
      subscribedBranchCount: agentSubForm.subscribedBranchCount,
      status: agentSubForm.status,
    }
    if (agentSubForm.currentPeriodEnd) {
      body.currentPeriodEnd = new Date(agentSubForm.currentPeriodEnd).toISOString()
    }
    setAgentSubscriptionMutation.mutate({ agentId: selectedAgent.id, body })
  }

  // Stats
  const totalSources = sources.length
  const activeSubs = sources.filter((s) => {
    const sub = subscriptionsBySource[s.id]
    return sub?.status === 'active'
  }).length
  const totalBranches = sources.reduce((sum, s) => sum + (subscriptionsBySource[s.id]?.branchCount ?? 0), 0)
  const totalLocations = sources.reduce((sum, s) => sum + (subscriptionsBySource[s.id]?.locationCount ?? 0), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-7 h-7" />
          Billing & Plans
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('source')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px ${activeTab === 'source' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          Source Billing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agent')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px ${activeTab === 'agent' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          Agent Billing
        </button>
      </div>

      {activeTab === 'source' && (
        <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-gray-500">Total Sources</div>
            <div className="text-2xl font-bold">{totalSources}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-gray-500">Active Subscriptions</div>
            <div className="text-2xl font-bold text-green-600">{activeSubs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Building2 className="w-3.5 h-3.5" /> Total Branches
            </div>
            <div className="text-2xl font-bold">{totalBranches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="w-3.5 h-3.5" /> Total Locations
              <Badge variant="info" className="text-[10px] px-1.5 py-0">Unlimited</Badge>
            </div>
            <div className="text-2xl font-bold">{totalLocations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plans</CardTitle>
          <Button onClick={openCreatePlan} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Create plan
          </Button>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <Loader />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Interval</th>
                    <th className="text-left py-2">Price / branch</th>
                    <th className="text-left py-2">Branch limit</th>
                    <th className="text-left py-2">Locations</th>
                    <th className="text-left py-2">Active</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 font-medium">{plan.name}</td>
                      <td className="py-2">{INTERVAL_LABELS[plan.interval]}</td>
                      <td className="py-2">{formatCurrency(plan.pricePerBranchCents ?? plan.amountCents)}</td>
                      <td className="py-2">
                        {plan.branchLimit === 0 ? (
                          <span className="text-gray-500">Per subscription</span>
                        ) : (
                          plan.branchLimit
                        )}
                      </td>
                      <td className="py-2">
                        <Badge variant="info" className="text-xs">Unlimited</Badge>
                      </td>
                      <td className="py-2">
                        <Badge variant={plan.active ? 'success' : 'default'}>{plan.active ? 'Yes' : 'No'}</Badge>
                      </td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditPlan(plan)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {plans.length === 0 && (
                <p className="text-gray-500 py-4">No plans yet. Create a plan to get started.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Source Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {sourcesLoading ? (
            <Loader />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Source</th>
                    <th className="text-left py-2">Plan</th>
                    <th className="text-left py-2">Branches</th>
                    <th className="text-left py-2">Branch Limit</th>
                    <th className="text-left py-2">Locations</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Expires</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => {
                    const sub = subscriptionsBySource[source.id]
                    const isExpired = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) < new Date() : true
                    const branchCount = sub?.branchCount ?? 0
                    const locationCount = sub?.locationCount ?? 0
                    const branchLimit = sub?.subscribedBranchCount ?? 0
                    const branchUsagePercent = branchLimit > 0 ? Math.round((branchCount / branchLimit) * 100) : 0
                    const isOverLimit = branchLimit > 0 && branchCount > branchLimit

                    return (
                      <tr key={source.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2">
                          <div className="font-medium">{source.companyName}</div>
                          <div className="text-gray-500 text-xs">{source.email}</div>
                        </td>
                        <td className="py-2">{sub?.plan?.name ?? <span className="text-gray-400">No plan</span>}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span className={isOverLimit ? 'text-red-600 font-semibold' : ''}>
                              {sub ? branchCount : '—'}
                            </span>
                            {sub && branchLimit > 0 && (
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isOverLimit ? 'bg-red-500' : branchUsagePercent > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(branchUsagePercent, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2">
                          {sub ? (
                            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {branchLimit === 0 ? '∞' : branchLimit}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-1.5">
                            <span>{sub ? locationCount : '—'}</span>
                            {sub && <span className="text-gray-400 text-xs">(unlimited)</span>}
                          </div>
                        </td>
                        <td className="py-2">
                          {sub ? (
                            <Badge variant={
                              sub.status === 'active' && !isExpired
                                ? 'success'
                                : sub.status === 'past_due'
                                ? 'warning'
                                : 'default'
                            }>
                              {STATUS_LABELS[sub.status] || sub.status}
                              {isExpired && sub.status === 'active' ? ' (expired)' : ''}
                            </Badge>
                          ) : (
                            <Badge variant="default">None</Badge>
                          )}
                        </td>
                        <td className="py-2 text-xs text-gray-600">
                          {sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '—'}
                        </td>
                        <td className="py-2 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEditSubscription(source)}>
                            <Settings className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {sources.length === 0 && <p className="text-gray-500 py-4">No source companies.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Modal */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => {
          setPlanModalOpen(false)
          setEditingPlan(null)
        }}
        title={editingPlan ? 'Edit plan' : 'Create plan'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={planForm.name}
              onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Monthly"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Interval</label>
            <Select
              value={planForm.interval}
              onChange={(e) => setPlanForm((f) => ({ ...f, interval: e.target.value as PlanInterval }))}
              options={[
                { value: 'WEEKLY', label: 'Weekly' },
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'YEARLY', label: 'Yearly' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price per branch (EUR)</label>
            <Input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={planPriceEurInput}
              onChange={(e) => setPlanPriceEurInput(e.target.value)}
              placeholder="e.g. 6.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the amount in euros (decimals allowed). This is billed per branch per billing interval; Stripe still stores minor units internally.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default branch limit (0 = set per subscription)</label>
            <Input
              type="number"
              value={planForm.branchLimit}
              onChange={(e) => setPlanForm((f) => ({ ...f, branchLimit: parseInt(e.target.value, 10) || 0 }))}
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
            <strong>Locations are unlimited</strong> for all plans. Only branches count against the quota.
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-900">
            <strong>Stripe / EUR:</strong> Source checkout uses <strong>EUR</strong> only. If you paste a custom Stripe
            Price ID, it must be an <strong>EUR</strong> recurring price. Changing interval or per-branch cents clears the
            stored Price ID so the next checkout can auto-create an EUR price (or paste a new EUR price ID) when the per-branch EUR amount or interval changes.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSavePlan} disabled={!planForm.name}>
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Subscription Edit Modal */}
      <Modal
        isOpen={subscriptionModalOpen}
        onClose={() => {
          setSubscriptionModalOpen(false)
          setSelectedSource(null)
          setSelectedSub(null)
        }}
        title={selectedSource ? `Edit Subscription: ${selectedSource.companyName}` : 'Edit Subscription'}
      >
        <div className="space-y-4">
          {selectedSub && (
            <div className="bg-gray-50 rounded-md p-3 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="text-gray-500">Current branches:</div>
              <div className="font-medium">{selectedSub.branchCount ?? 0}</div>
              <div className="text-gray-500">Current locations:</div>
              <div className="font-medium">{selectedSub.locationCount ?? 0} <span className="text-gray-400">(unlimited)</span></div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Plan</label>
            <Select
              value={subForm.planId}
              onChange={(e) => setSubForm((f) => ({ ...f, planId: e.target.value }))}
              options={
                plans.length > 0
                  ? plans.map((p) => ({
                      value: p.id,
                      label: `${p.name} (${formatCurrency(p.pricePerBranchCents ?? p.amountCents)} / branch / ${p.interval.toLowerCase()})`,
                    }))
                  : [{ value: '', label: 'No plans' }]
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Branch limit
              <span className="text-gray-400 font-normal ml-1">(0 = unlimited)</span>
            </label>
            <Input
              type="number"
              min={0}
              value={subForm.subscribedBranchCount}
              onChange={(e) => setSubForm((f) => ({ ...f, subscribedBranchCount: parseInt(e.target.value, 10) || 0 }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              How many branches this source is allowed to import. Set to 0 for unlimited.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={subForm.status}
              onChange={(e) => setSubForm((f) => ({ ...f, status: e.target.value as SubscriptionStatus }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'trialing', label: 'Trialing' },
                { value: 'past_due', label: 'Past Due' },
                { value: 'canceled', label: 'Canceled' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expiry date</label>
            <Input
              type="datetime-local"
              value={subForm.currentPeriodEnd}
              onChange={(e) => setSubForm((f) => ({ ...f, currentPeriodEnd: e.target.value }))}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
            <strong>Locations are always unlimited.</strong> Only branches count against the subscribed limit.
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSubscriptionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSubscription}
              disabled={!selectedSource || !subForm.planId || setSubscriptionMutation.isPending}
            >
              {setSubscriptionMutation.isPending ? 'Saving...' : 'Save Subscription'}
            </Button>
          </div>
        </div>
      </Modal>
        </>
      )}

      {activeTab === 'agent' && (
        <>
      {/* Agent stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-gray-500">Total Agents</div>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-gray-500">Active Agent Subscriptions</div>
            <div className="text-2xl font-bold text-green-600">
              {Object.values(agentSubsByAgent).filter(s => s && s.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-gray-500">Total Agent Branches</div>
            <div className="text-2xl font-bold">
              {Object.values(agentSubsByAgent).reduce((sum, s) => sum + (s?.effectiveBranchCount ?? 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Agent Plans</CardTitle>
          <Button onClick={openCreateAgentPlan} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Create agent plan
          </Button>
        </CardHeader>
        <CardContent>
          {agentPlansLoading ? (
            <Loader />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Interval</th>
                    <th className="text-left py-2">Branch limit</th>
                    <th className="text-left py-2">Default price</th>
                    <th className="text-left py-2">Active</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPlans.map((plan) => (
                    <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 font-medium">{plan.name}</td>
                      <td className="py-2">{INTERVAL_LABELS[plan.interval]}</td>
                      <td className="py-2">{plan.branchLimit === 0 ? 'Unlimited' : plan.branchLimit}</td>
                      <td className="py-2">{formatCurrency(plan.defaultPriceCents)}</td>
                      <td className="py-2">
                        <Badge variant={plan.active ? 'success' : 'default'}>{plan.active ? 'Yes' : 'No'}</Badge>
                      </td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditAgentPlan(plan)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {agentPlans.length === 0 && (
                <p className="text-gray-500 py-4">No agent plans yet. Create one to get started.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {agentsLoading ? (
            <Loader />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Agent</th>
                    <th className="text-left py-2">Plan</th>
                    <th className="text-left py-2">Subscribed</th>
                    <th className="text-left py-2">Effective</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Expires</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => {
                    const sub = agentSubsByAgent[agent.id]
                    const isExpired = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) < new Date() : false
                    return (
                      <tr key={agent.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2">
                          <div className="font-medium">{agent.companyName}</div>
                          <div className="text-gray-500 text-xs">{agent.email}</div>
                        </td>
                        <td className="py-2">{sub?.agentPlan?.name ?? <span className="text-gray-400">No plan</span>}</td>
                        <td className="py-2">{sub ? (sub.subscribedBranchCount === 0 ? '∞' : sub.subscribedBranchCount) : '—'}</td>
                        <td className="py-2">{sub?.effectiveBranchCount ?? '—'}</td>
                        <td className="py-2">
                          {sub ? (
                            <Badge variant={sub.status === 'active' && !isExpired ? 'success' : sub.status === 'past_due' ? 'warning' : 'default'}>
                              {STATUS_LABELS[sub.status] || sub.status}
                              {isExpired && sub.status === 'active' ? ' (expired)' : ''}
                            </Badge>
                          ) : (
                            <Badge variant="default">None</Badge>
                          )}
                        </td>
                        <td className="py-2 text-xs text-gray-600">
                          {sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '—'}
                        </td>
                        <td className="py-2 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEditAgentSubscription(agent)}>
                            <Settings className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {agents.length === 0 && <p className="text-gray-500 py-4">No agent companies.</p>}
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {/* Agent Plan Modal */}
      <Modal
        isOpen={agentPlanModalOpen}
        onClose={() => {
          setAgentPlanModalOpen(false)
          setEditingAgentPlan(null)
        }}
        title={editingAgentPlan ? 'Edit agent plan' : 'Create agent plan'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={agentPlanForm.name}
              onChange={(e) => setAgentPlanForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Agent Monthly"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Interval</label>
            <Select
              value={agentPlanForm.interval}
              onChange={(e) => setAgentPlanForm((f) => ({ ...f, interval: e.target.value as PlanInterval }))}
              options={[
                { value: 'WEEKLY', label: 'Weekly' },
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'YEARLY', label: 'Yearly' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Branch limit (0 = unlimited)</label>
            <Input
              type="number"
              min={0}
              value={agentPlanForm.branchLimit}
              onChange={(e) => setAgentPlanForm((f) => ({ ...f, branchLimit: parseInt(e.target.value, 10) || 0 }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default price (cents)</label>
            <Input
              type="number"
              min={0}
              value={agentPlanForm.defaultPriceCents}
              onChange={(e) => setAgentPlanForm((f) => ({ ...f, defaultPriceCents: parseInt(e.target.value, 10) || 0 }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country prices</label>
            <p className="text-xs text-gray-500 mb-2">e.g. IN 200, US 1000 (price per branch in cents)</p>
            <div className="space-y-2">
              {countryPrices.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Country (e.g. IN)"
                    value={p.countryCode}
                    onChange={(e) => setCountryPrices(prev => prev.map((x, j) => j === i ? { ...x, countryCode: e.target.value.toUpperCase().slice(0, 2) } : x))}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="Cents"
                    value={p.pricePerBranchCents}
                    onChange={(e) => setCountryPrices(prev => prev.map((x, j) => j === i ? { ...x, pricePerBranchCents: parseInt(e.target.value, 10) || 0 } : x))}
                    className="w-28"
                  />
                  <Button variant="ghost" size="sm" onClick={() => setCountryPrices(prev => prev.filter((_, j) => j !== i))}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setCountryPrices(prev => [...prev, { countryCode: '', pricePerBranchCents: 0 }])}>
                <Plus className="w-4 h-4 mr-1" /> Add country
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAgentPlanModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSaveAgentPlan}
              disabled={!agentPlanForm.name || createAgentPlanMutation.isPending || updateAgentPlanMutation.isPending}
            >
              {editingAgentPlan ? (updateAgentPlanMutation.isPending ? 'Saving...' : 'Update') : (createAgentPlanMutation.isPending ? 'Creating...' : 'Create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Agent Subscription Modal */}
      <Modal
        isOpen={agentSubscriptionModalOpen}
        onClose={() => {
          setAgentSubscriptionModalOpen(false)
          setSelectedAgent(null)
          setSelectedAgentSub(null)
        }}
        title={selectedAgent ? `Edit Subscription: ${selectedAgent.companyName}` : 'Edit Agent Subscription'}
      >
        <div className="space-y-4">
          {selectedAgentSub && (
            <div className="bg-gray-50 rounded-md p-3 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="text-gray-500">Effective branches:</div>
              <div className="font-medium">{selectedAgentSub.effectiveBranchCount ?? 0}</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Plan</label>
            <Select
              value={agentSubForm.planId}
              onChange={(e) => setAgentSubForm((f) => ({ ...f, planId: e.target.value }))}
              options={
                agentPlans.length > 0
                  ? agentPlans.map((p) => ({ value: p.id, label: `${p.name} (${formatCurrency(p.defaultPriceCents)} default)` }))
                  : [{ value: '', label: 'No agent plans' }]
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subscribed branch count (0 = unlimited)</label>
            <Input
              type="number"
              min={0}
              value={agentSubForm.subscribedBranchCount}
              onChange={(e) => setAgentSubForm((f) => ({ ...f, subscribedBranchCount: parseInt(e.target.value, 10) || 0 }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={agentSubForm.status}
              onChange={(e) => setAgentSubForm((f) => ({ ...f, status: e.target.value as SubscriptionStatus }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'trialing', label: 'Trialing' },
                { value: 'past_due', label: 'Past Due' },
                { value: 'canceled', label: 'Canceled' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expiry date</label>
            <Input
              type="datetime-local"
              value={agentSubForm.currentPeriodEnd}
              onChange={(e) => setAgentSubForm((f) => ({ ...f, currentPeriodEnd: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAgentSubscriptionModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSaveAgentSubscription}
              disabled={!selectedAgent || !agentSubForm.planId || setAgentSubscriptionMutation.isPending}
            >
              {setAgentSubscriptionMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
