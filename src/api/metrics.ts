import http from '../lib/http'

export const metricsApi = {
  fetchMetrics: async (): Promise<string> => {
    try {
      const response = await http.get('/metrics', {
        headers: {
          'Accept': 'text/plain',
        },
        responseType: 'text', // Important: tell axios to treat response as text, not JSON
      })
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch metrics:', error)
      throw new Error(error.response?.data || error.message || 'Failed to fetch metrics')
    }
  },

  fetchMetricsJson: async (): Promise<any> => {
    try {
      const response = await http.get('/metrics/json')
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch metrics JSON:', error)
      throw new Error(error.response?.data || error.message || 'Failed to fetch metrics JSON')
    }
  },
}
