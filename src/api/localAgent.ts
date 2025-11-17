import axios from 'axios'

export const localAgentApi = (baseURL: string) => {
  const c = axios.create({ baseURL, timeout: 10000 })

  return {
    health: async () => (await c.get('/health')).data,
    test: async () => (await c.get('/test')).data,
    search: async (payload: any) => (await c.post('/search', payload)).data,
    book: async (payload: any) => (await c.post('/book', payload)).data,
  }
}


