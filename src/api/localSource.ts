import axios from 'axios'

export const localSourceApi = (baseURL: string) => {
  const c = axios.create({ baseURL, timeout: 10000 })

  return {
    health: async () => (await c.get('/health')).data,
    locations: async () => (await c.get('/locations')).data,
    availability: async (payload: any) => (await c.post('/availability', payload)).data,
    createBooking: async (payload: any) => (await c.post('/booking/create', payload)).data,
    modifyBooking: async (payload: any) => (await c.post('/booking/modify', payload)).data,
    cancelBooking: async (payload: any) => (await c.post('/booking/cancel', payload)).data,
    checkBooking: async (ref: string) => (await c.get(`/booking/check/${encodeURIComponent(ref)}`)).data,
  }
}


