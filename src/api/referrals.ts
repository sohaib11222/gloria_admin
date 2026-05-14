import http from '../lib/http'

export type ReferralRestrict = 'AGENT' | 'SOURCE' | null

export interface ReferralLink {
  id: string
  slug: string
  label: string | null
  restrictToType: ReferralRestrict
  active: boolean
  createdAt: string
  updatedAt: string
  signupCount: number
  signupsByType: { AGENT: number; SOURCE: number }
}

export interface CreateReferralLinkBody {
  slug: string
  label?: string | null
  restrictToType?: ReferralRestrict
}

export interface PatchReferralLinkBody {
  label?: string | null
  active?: boolean
  restrictToType?: ReferralRestrict
}

export interface ReferralSignupCompany {
  id: string
  companyName: string
  email: string
  type: 'AGENT' | 'SOURCE'
  status: string
  approvalStatus: string
  companyCode: string | null
  createdAt: string
}

export const referralsApi = {
  list: async (): Promise<{ items: ReferralLink[] }> => {
    const res = await http.get('/admin/referral-links')
    return res.data
  },
  create: async (body: CreateReferralLinkBody) => {
    const res = await http.post('/admin/referral-links', body)
    return res.data
  },
  patch: async (id: string, body: PatchReferralLinkBody) => {
    const res = await http.patch(`/admin/referral-links/${id}`, body)
    return res.data
  },
  getSignups: async (id: string): Promise<{ items: ReferralSignupCompany[] }> => {
    const res = await http.get(`/admin/referral-links/${id}/signups`)
    return res.data
  },
}
