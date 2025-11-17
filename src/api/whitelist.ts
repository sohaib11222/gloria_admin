import http from '../lib/http'

export interface WhitelistEntry {
  id: string
  ip: string
  type: 'agent' | 'source' | 'admin'
  enabled: boolean
  createdAt: string
  updatedAt?: string
}

export interface WhitelistTestResult {
  ip: string
  accessible: boolean
  responseTime?: number
  error?: string
}

export interface BranchImportResponse {
  message: string
  imported: number
  updated: number
  total: number
}

export const whitelistApi = {
  // List all IP whitelist entries (admin only)
  listWhitelist: async (): Promise<WhitelistEntry[]> => {
    try {
      const response = await http.get('/admin/whitelist')
      return response.data?.items || response.data || []
    } catch (error: any) {
      // Try alternative endpoint
      try {
        const response = await http.get('/admin/ip-whitelist')
        return response.data?.items || response.data || []
      } catch {
        throw error
      }
    }
  },

  // Add or update IP whitelist entry
  addWhitelistEntry: async (data: {
    ip: string
    type: 'agent' | 'source' | 'admin'
    enabled?: boolean
  }): Promise<WhitelistEntry> => {
    try {
      const response = await http.post('/admin/whitelist', {
        ip: data.ip,
        type: data.type,
        enabled: data.enabled !== undefined ? data.enabled : true,
      })
      return response.data
    } catch (error: any) {
      // Try alternative endpoint
      try {
        const response = await http.post('/admin/ip-whitelist', {
          ip: data.ip,
          type: data.type,
          enabled: data.enabled !== undefined ? data.enabled : true,
        })
        return response.data
      } catch {
        throw error
      }
    }
  },

  // Remove IP whitelist entry
  removeWhitelistEntry: async (entryId: string): Promise<void> => {
    try {
      await http.delete(`/admin/whitelist/${entryId}`)
    } catch (error: any) {
      // Try alternative endpoint
      try {
        await http.delete(`/admin/ip-whitelist/${entryId}`)
      } catch {
        throw error
      }
    }
  },

  // Test whitelist (if endpoint exists)
  testWhitelist: async (companyId: string): Promise<WhitelistTestResult[]> => {
    try {
      const response = await http.post('/admin/whitelist/test', {
        companyId,
      })
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Fallback: test by calling health endpoint
        try {
          const healthResponse = await http.get(`/admin/health/check/${companyId}`)
          return [{
            ip: 'unknown',
            accessible: healthResponse.status === 200,
            responseTime: Date.now(),
          }]
        } catch (healthError) {
          return [{
            ip: 'unknown',
            accessible: false,
            error: 'Health check failed',
          }]
        }
      }
      throw error
    }
  },
}

// Branch import API
export const branchImportApi = {
  importBranches: async (sourceId: string): Promise<BranchImportResponse> => {
    const response = await http.post(`/admin/sources/${sourceId}/import-branches`)
    return response.data
  },
}

// Company whitelist (domains) API - for companies to manage their own whitelisted domains
export interface CompanyWhitelistResponse {
  message: string
  whitelistedDomains: string[]
}

export const companyWhitelistApi = {
  // Get company whitelist (from company settings)
  getCompanyWhitelist: async (): Promise<string[]> => {
    try {
      const response = await http.get('/settings')
      return response.data?.whitelistedDomains 
        ? (Array.isArray(response.data.whitelistedDomains) 
            ? response.data.whitelistedDomains 
            : response.data.whitelistedDomains.split(',').filter(Boolean))
        : []
    } catch (error: any) {
      if (error.response?.status === 404) {
        return []
      }
      throw error
    }
  },

  // Update company whitelist (domains)
  updateCompanyWhitelist: async (domains: string[] | string): Promise<CompanyWhitelistResponse> => {
    const response = await http.post('/settings/whitelist', {
      domains: Array.isArray(domains) ? domains : domains.split(',').map(d => d.trim()).filter(Boolean),
    })
    return response.data
  },
}

// Location validation API - for sources to validate location JSON
export interface LocationValidationRequest {
  CompanyCode?: string
  Branchcode?: string
  Name?: string
  LocationType?: string
  CollectionType?: string
  AtAirport?: boolean
  Latitude?: number
  Longitude?: number
  EmailAddress?: string
  Telephone?: {
    attr?: {
      PhoneNumber?: string
    }
  }
  Address?: {
    AddressLine?: { value?: string }
    CityName?: { value?: string }
    PostalCode?: { value?: string }
    CountryName?: {
      value?: string
      attr?: { Code?: string }
    }
  }
  Opening?: {
    Monday?: { attr?: { Open?: string; Closed?: string } }
    Tuesday?: { attr?: { Open?: string; Closed?: string } }
    Wednesday?: { attr?: { Open?: string; Closed?: string } }
    Thursday?: { attr?: { Open?: string; Closed?: string } }
    Friday?: { attr?: { Open?: string; Closed?: string } }
    Saturday?: { attr?: { Open?: string; Closed?: string } }
    Sunday?: { attr?: { Open?: string; Closed?: string } }
  }
  [key: string]: any
}

export interface LocationValidationResponse {
  status: 'success' | 'error'
  message: string
  fields?: string[]
  days?: string[]
  error?: string
}

export const locationValidationApi = {
  validateLocation: async (payload: LocationValidationRequest): Promise<LocationValidationResponse> => {
    const response = await http.post('/api/v1/location/validate', payload)
    return response.data
  },
}