import http from '../lib/http'

export const adminTestApi = {
  getUiConfig: async () => {
    const { data } = await http.get('/ui/config')
    return data
  },
  testSourceGrpc: async (payload: { address: string; availabilityPayload?: any; runBooking?: boolean; bookingPayload?: any }) => {
    const { data } = await http.post('/admin/test/source-grpc', payload)
    return data
  },
  testAgentGrpc: async (payload: { address: string; searchPayload?: any; bookPayload?: any }) => {
    const { data } = await http.post('/admin/test/agent-grpc', payload)
    return data
  },
}





