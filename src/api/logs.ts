import http from '../lib/http'

export interface LogEntry {
  id: string
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  message: string
  requestId?: string
  companyId?: string
  sourceId?: string
  endpoint?: string
  http_status?: number
  grpc_status?: string
  maskedRequest?: string
  maskedResponse?: string
}

export interface LogsResponse {
  data: LogEntry[]
  total: number
  page: number
  limit: number
  nextCursor?: string
  hasMore?: boolean
}

export const logsApi = {
  listLogs: async (params?: {
    q?: string
    level?: string
    companyId?: string
    sourceId?: string
    endpoint?: string
    fromIso?: string
    toIso?: string
    limit?: number
    cursor?: string
  }): Promise<LogsResponse> => {
    try {
      const response = await http.get('/admin/logs', { params })
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Fallback to empty state if logs endpoint doesn't exist
        return {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
        }
      }
      throw error
    }
  },
  // System logs aligned to the provided sample response shape
  listSystemLogs: async (params?: {
    limit?: number
    cursor?: string
  }): Promise<{
    items: Array<{
      id: string
      direction: string
      endpoint: string
      requestId: string
      companyId: string
      sourceId: string
      httpStatus: number | null
      grpcStatus: string | null
      maskedRequest: string
      maskedResponse: any
      durationMs: number
      createdAt: string
      status: string
      duration: string
      requestSize: number
      responseSize: number
      rawRequest?: string
      rawResponse?: string
    }>
    nextCursor: string
    total: number
    hasMore: boolean
  }> => {
    const response = await http.get('/admin/logs', { params })
    return response.data
  },
}
