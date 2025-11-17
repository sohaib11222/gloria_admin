import http from '../lib/http'

export interface VerificationTest {
  name: string
  description?: string
  status: 'PASSED' | 'FAILED' | 'SKIPPED'
  duration_ms?: number
  error?: string
}

export interface VerificationReport {
  total_tests: number
  passed_tests: number
  failed_tests: number
  test_results: VerificationTest[]
  errors?: string[]
  duration_ms: number
}

export interface VerificationStatus {
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  last_verified?: string
  report?: VerificationReport
}

export const verificationApi = {
  runSourceVerification: async (): Promise<VerificationReport> => {
    const response = await http.post('/verification/source/run')
    return response.data
  },

  runAgentVerification: async (): Promise<VerificationReport> => {
    const response = await http.post('/verification/agent/run')
    return response.data
  },

  getVerificationStatus: async (): Promise<VerificationStatus> => {
    const response = await http.get('/verification/status')
    return response.data
  },
}
