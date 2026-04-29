import http from '../lib/http'

export type PlanInterval = 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

export interface Plan {
  id: string
  name: string
  interval: PlanInterval
  stripePriceId: string | null
  amountCents: number
  pricePerBranchCents: number
  branchLimit: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface SourceSubscription {
  id: string
  sourceId: string
  planId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  subscribedBranchCount: number
  status: SubscriptionStatus
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  createdAt: string
  updatedAt: string
  plan?: Plan
  source?: { id: string; companyName: string; email: string; type: string }
  branchCount?: number
  locationCount?: number
}

export interface CreatePlanBody {
  name: string
  interval: PlanInterval
  amountCents: number
  pricePerBranchCents: number
  branchLimit: number
  stripePriceId?: string
}

export interface UpdatePlanBody {
  name?: string
  interval?: PlanInterval
  amountCents?: number
  pricePerBranchCents?: number
  branchLimit?: number
  stripePriceId?: string | null
  active?: boolean
}

export interface SetSourceSubscriptionBody {
  planId: string
  currentPeriodEnd?: string
  subscribedBranchCount?: number
  status?: SubscriptionStatus
}

export const billingApi = {
  listPlans: async (): Promise<{ items: Plan[] }> => {
    const { data } = await http.get('/admin/plans')
    return data
  },

  createPlan: async (body: CreatePlanBody): Promise<Plan> => {
    const { data } = await http.post('/admin/plans', body)
    return data
  },

  updatePlan: async (id: string, body: UpdatePlanBody): Promise<Plan> => {
    const { data } = await http.patch(`/admin/plans/${id}`, body)
    return data
  },

  getSourceSubscription: async (sourceId: string): Promise<SourceSubscription> => {
    const { data } = await http.get(`/admin/sources/${sourceId}/subscription`)
    return data
  },

  setSourceSubscription: async (sourceId: string, body: SetSourceSubscriptionBody): Promise<SourceSubscription> => {
    const { data } = await http.patch(`/admin/sources/${sourceId}/subscription`, body)
    return data
  },
}

export interface BillingTransaction {
  id: string
  stripeInvoiceId: string
  sourceId: string | null
  sourceName: string | null
  customerEmail: string | null
  planName: string | null
  status: string
  amountPaid: number
  amountDue: number
  currency: string
  createdAt: string | null
  periodStart: string | null
  periodEnd: string | null
  invoicePdf: string | null
  hostedInvoiceUrl: string | null
}

export const transactionsApi = {
  listAdmin: async (): Promise<{ items: BillingTransaction[] }> => {
    const { data } = await http.get('/admin/transactions')
    return data
  },
}

// --- Agent billing ---
export interface AgentPlanCountryPrice {
  id: string
  agentPlanId: string
  countryCode: string
  pricePerBranchCents: number
  stripePriceId: string | null
  createdAt: string
  updatedAt: string
}

export interface AgentPlan {
  id: string
  name: string
  interval: PlanInterval
  branchLimit: number
  defaultPriceCents: number
  active: boolean
  createdAt: string
  updatedAt: string
  countryPrices?: AgentPlanCountryPrice[]
}

export interface AgentSubscription {
  id: string
  agentId: string
  agentPlanId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  subscribedBranchCount: number
  status: SubscriptionStatus
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  createdAt: string
  updatedAt: string
  agentPlan?: AgentPlan
  agent?: { id: string; companyName: string; email: string; billingCountryCode?: string | null }
  effectiveBranchCount?: number
}

export interface CreateAgentPlanBody {
  name: string
  interval: PlanInterval
  branchLimit: number
  defaultPriceCents: number
  active?: boolean
}

export interface UpdateAgentPlanBody {
  name?: string
  interval?: PlanInterval
  branchLimit?: number
  defaultPriceCents?: number
  active?: boolean
}

export interface SetAgentPlanCountryPricesBody {
  prices: Array<{
    countryCode: string
    pricePerBranchCents: number
    stripePriceId?: string | null
  }>
}

export interface SetAgentSubscriptionBody {
  planId: string
  currentPeriodEnd?: string
  subscribedBranchCount?: number
  status?: SubscriptionStatus
}

export const agentBillingApi = {
  listAgentPlans: async (): Promise<{ items: AgentPlan[] }> => {
    const { data } = await http.get('/admin/agent-plans')
    return data
  },

  createAgentPlan: async (body: CreateAgentPlanBody): Promise<AgentPlan> => {
    const { data } = await http.post('/admin/agent-plans', body)
    return data
  },

  updateAgentPlan: async (id: string, body: UpdateAgentPlanBody): Promise<AgentPlan> => {
    const { data } = await http.patch(`/admin/agent-plans/${id}`, body)
    return data
  },

  getAgentPlanCountryPrices: async (planId: string): Promise<{ items: AgentPlanCountryPrice[] }> => {
    const { data } = await http.get(`/admin/agent-plans/${planId}/country-prices`)
    return data
  },

  setAgentPlanCountryPrices: async (planId: string, body: SetAgentPlanCountryPricesBody): Promise<{ items: AgentPlanCountryPrice[] }> => {
    const { data } = await http.put(`/admin/agent-plans/${planId}/country-prices`, body)
    return data
  },

  getAgentSubscription: async (agentId: string): Promise<AgentSubscription & { subscription?: null; agent?: { id: string; companyName: string; email: string; billingCountryCode?: string | null }; effectiveBranchCount?: number }> => {
    const { data } = await http.get(`/admin/agents/${agentId}/subscription`)
    return data
  },

  setAgentSubscription: async (agentId: string, body: SetAgentSubscriptionBody): Promise<AgentSubscription> => {
    const { data } = await http.patch(`/admin/agents/${agentId}/subscription`, body)
    return data
  },
}
