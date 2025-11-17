import http from '../lib/http'

export interface Location {
  unlocode: string
  name: string
  country: string
  city?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface LocationListResponse {
  data: Location[]
  total: number
  page: number
  limit: number
}

export const locationsApi = {
  getSourceLocations: async (sourceId: string): Promise<LocationListResponse> => {
    const response = await http.get('/locations', {
      params: { sourceId },
    })
    return response.data
  },

  getAllLocations: async (params?: {
    query?: string
    country?: string
    page?: number
    limit?: number
  }): Promise<LocationListResponse> => {
    const response = await http.get('/locations', { params })
    return response.data
  },

  syncSourceLocations: async (sourceId: string): Promise<{ synced_count: number }> => {
    const response = await http.post(`/admin/locations/sync/${sourceId}`)
    return response.data
  },

  exportLocations: async (sourceId?: string): Promise<Blob> => {
    const params = sourceId ? { sourceId } : {}
    const response = await http.get('/admin/locations/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  getByAgreement: async (agreementId: string): Promise<LocationListResponse> => {
    const response = await http.get(`/locations/by-agreement/${agreementId}`)
    return response.data
  },

  // New per-spec endpoint
  getAgreementLocations: async (agreementId: string): Promise<{ items: Array<{ unlocode: string; allowed: boolean }>; inherited?: boolean }> => {
    const response = await http.get(`/agreements/${agreementId}/locations`)
    return response.data
  },

  // Admin summary of sources and counts
  listSourcesLocationCounts: async (): Promise<{ items: Array<{ sourceId: string; companyName: string; status: string; locations: number }>; total: number }> => {
    const response = await http.get('/admin/locations/sources')
    return response.data
  },
}
