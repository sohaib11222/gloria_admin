import http from '../lib/http'

export interface HealthCheck {
  name: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message?: string
  response_time?: number
  details?: any
}

export interface HealthStatus {
  overall_status: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED'
  last_checked: string
  checks: Record<string, HealthCheck>
  system_info?: Record<string, any>
}

export interface SourceHealth {
  companyId: string
  companyName: string
  slowRate: number
  sampleCount: number
  backoffLevel: number
  excludedUntil?: string
  lastCheck?: string
  status: 'HEALTHY' | 'SLOW' | 'EXCLUDED'
}

export const healthApi = {
  getHealthStatus: async (): Promise<HealthStatus> => {
    const response = await http.get('/admin/health')
    return response.data
  },

  getSourceHealth: async (): Promise<SourceHealth[]> => {
    const response = await http.get('/admin/health/sources')
    return response.data
  },

  resetHealth: async (companyId?: string): Promise<void> => {
    const url = companyId ? `/admin/health/reset/${companyId}` : '/admin/health/reset'
    await http.post(url)
  },

  runHealthCheck: async (companyId: string): Promise<HealthCheck> => {
    const response = await http.post(`/admin/health/check/${companyId}`)
    return response.data
  },
}
