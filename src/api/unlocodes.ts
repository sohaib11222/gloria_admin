import http from '../lib/http'

export interface UNLocode {
  unlocode: string
  country: string
  place: string
  iataCode?: string | null
  latitude?: number | null
  longitude?: number | null
  usageCount?: number
}

export interface UNLocodeListResponse {
  items: UNLocode[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface UNLocodeDetail extends UNLocode {
  sourceLocations?: Array<{
    id: string
    source: {
      id: string
      companyName: string
      companyCode: string | null
    }
  }>
  agreementLocationOverrides?: Array<{
    id: string
    agreement: {
      id: string
      agreementRef: string
      agent: {
        companyName: string
      }
      source: {
        companyName: string
      }
    }
  }>
  _count?: {
    sourceLocations: number
    agreementLocationOverrides: number
  }
}

export interface CreateUNLocodeRequest {
  unlocode: string
  country: string
  place: string
  iataCode?: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface UpdateUNLocodeRequest {
  country?: string
  place?: string
  iataCode?: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface ImportUNLocodeRequest {
  csv: string
}

export interface ImportUNLocodeResponse {
  message: string
  imported: number
  updated: number
  total: number
  errors?: string[]
}

export const unlocodesApi = {
  list: async (params?: {
    query?: string
    country?: string
    limit?: number
    offset?: number
  }): Promise<UNLocodeListResponse> => {
    const response = await http.get('/admin/unlocodes', { params })
    return response.data
  },

  get: async (unlocode: string): Promise<UNLocodeDetail> => {
    const response = await http.get(`/admin/unlocodes/${unlocode}`)
    return response.data
  },

  create: async (data: CreateUNLocodeRequest): Promise<UNLocode> => {
    const response = await http.post('/admin/unlocodes', data)
    return response.data
  },

  update: async (unlocode: string, data: UpdateUNLocodeRequest): Promise<UNLocode> => {
    const response = await http.patch(`/admin/unlocodes/${unlocode}`, data)
    return response.data
  },

  delete: async (unlocode: string): Promise<{ message: string }> => {
    const response = await http.delete(`/admin/unlocodes/${unlocode}`)
    return response.data
  },

  import: async (data: ImportUNLocodeRequest): Promise<ImportUNLocodeResponse> => {
    const response = await http.post('/admin/unlocodes/import', data)
    return response.data
  },
}

