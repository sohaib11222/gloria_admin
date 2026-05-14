import http from '../lib/http'

export interface AdminAvailabilitySampleItem {
  id: string
  sourceId: string
  source: { id: string; companyName: string; companyCode: string | null }
  criteriaHash: string
  pickupLoc: string
  returnLoc: string
  pickupIso: string
  returnIso: string
  offersCount: number
  offersSummary: unknown
  criteria: Record<string, unknown> | null
  fetchedAt: unknown
  updatedAt: string
}

export const availabilitySamplesApi = {
  list: async (params?: {
    sourceId?: string
    limit?: number
    offset?: number
  }): Promise<{
    items: AdminAvailabilitySampleItem[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }> => {
    const res = await http.get('/admin/availability-samples', { params })
    return res.data
  },
}
