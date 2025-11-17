import http from '../lib/http'

export const metricsApi = {
  fetchMetrics: async (): Promise<string> => {
    const response = await http.get('/metrics', {
      headers: {
        'Accept': 'text/plain',
      },
    })
    return response.data
  },

  fetchMetricsJson: async (): Promise<any> => {
    const response = await http.get('/metrics/json')
    return response.data
  },
}
