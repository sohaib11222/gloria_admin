import http from '../lib/http'
import { MW } from './routes'
import { AgreementCreateForm } from '../lib/validators'

export interface Agreement {
  id: string
  agentId: string
  sourceId: string
  agreementRef: string
  status: 'DRAFT' | 'OFFERED' | 'ACTIVE' | 'ACCEPTED' | 'SUSPENDED' | 'EXPIRED'
  validFrom: string
  validTo: string
  createdAt: string
  updatedAt: string
  agent?: {
    id: string
    companyName: string
    type: string
    status: string
    email: string
  }
  source?: {
    id: string
    companyName: string
    type: string
    status: string
    email: string
  }
}

export interface AgreementListResponse {
  data: Agreement[]
  total: number
  page: number
  limit: number
}

export const agreementsApi = {
  listAgreements: async (_params?: {
    status?: string
    agentId?: string
    sourceId?: string
    page?: number
    limit?: number
  }): Promise<AgreementListResponse> => {
    try {
      const response = await http.get(MW.agreements.list())
      const items = (response.data?.items ?? response.data ?? []) as any[]

      const mapped: Agreement[] = items.map((it: any) => ({
        id: it.id,
        agentId: it.agentId,
        sourceId: it.sourceId,
        agreementRef: it.agreementRef,
        status: it.status,
        validFrom: it.validFrom,
        validTo: it.validTo,
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
        agent: it.agent,
        source: it.source,
      }))

      return {
        data: mapped,
        total: mapped.length,
        page: 1,
        limit: mapped.length,
      }
    } catch (error) {
      console.error('Error fetching agreements:', error)
      throw error
    }
  },

  getAgreement: async (id: string): Promise<Agreement> => {
    try {
      const response = await http.get(MW.agreements.get(id))
      return response.data
    } catch (error) {
      console.error('Error fetching agreement:', error)
      throw error
    }
  },

  createAgreement: async (data: AgreementCreateForm): Promise<Agreement> => {
    const response = await http.post('/admin/agreements', data)
    return response.data
  },

  checkDuplicate: async (payload: {
    agreementRef: string
    agentId: string
    sourceId: string
  }): Promise<{ duplicate: boolean; existingId?: string }> => {
    const response = await http.post('/agreements/check-duplicate', payload)
    return response.data
  },

  acceptAgreement: async (id: string): Promise<Agreement> => {
    const response = await http.post(`/agreements/${id}/accept`)
    return response.data
  },

  activateAgreement: async (id: string): Promise<Agreement> => {
    try {
      const response = await http.post(MW.agreements.activate(id))
      return response.data
    } catch (error) {
      console.error('Error activating agreement:', error)
      throw error
    }
  },

  suspendAgreement: async (id: string): Promise<Agreement> => {
    try {
      const response = await http.post(MW.agreements.suspend(id))
      return response.data
    } catch (error) {
      console.error('Error suspending agreement:', error)
      throw error
    }
  },

  expireAgreement: async (id: string): Promise<Agreement> => {
    try {
      const response = await http.post(MW.agreements.expire(id))
      return response.data
    } catch (error) {
      console.error('Error expiring agreement:', error)
      throw error
    }
  },

  updateAgreementStatus: async (id: string, status: string): Promise<Agreement> => {
    const response = await http.patch(`/agreements/${id}/status`, { status })
    return response.data
  },
}
