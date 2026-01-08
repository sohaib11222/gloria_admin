import http from '../lib/http'
import { LoginForm } from '../lib/validators'

export interface LoginResponse {
  access: string
  refresh: string
  token?: string
  user?: any
  companyId?: string
}

export const authApi = {
  login: async (data: LoginForm): Promise<LoginResponse> => {
    const response = await http.post('/auth/login', data)
    return response.data
  },

  me: async () => {
    const response = await http.get('/auth/me')
    return response.data
  },

  logout: async () => {
    const response = await http.post('/auth/logout')
    return response.data
  },
}
