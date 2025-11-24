import http from '../lib/http'

export interface SmtpConfig {
  id: string
  host: string
  port: number
  secure: boolean
  user: string
  password?: string // Masked as '***' when returned
  fromEmail: string
  fromName?: string | null
  enabled: boolean
  createdAt: string
  updatedAt: string
  updatedBy?: string | null
}

export interface SmtpConfigResponse {
  configured: boolean
  usingEnvVars: boolean
  config: SmtpConfig | null
}

export interface SmtpConfigInput {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  fromEmail: string
  fromName?: string
  enabled: boolean
}

export const smtpApi = {
  /**
   * Get current SMTP configuration
   */
  getConfig: async (): Promise<SmtpConfigResponse> => {
    const response = await http.get('/admin/smtp')
    return response.data
  },

  /**
   * Create or update SMTP configuration
   */
  saveConfig: async (config: SmtpConfigInput): Promise<{ success: boolean; config: SmtpConfig }> => {
    const response = await http.post('/admin/smtp', config)
    return response.data
  },

  /**
   * Partially update SMTP configuration
   */
  updateConfig: async (config: Partial<SmtpConfigInput>): Promise<{ success: boolean; config: SmtpConfig }> => {
    const response = await http.patch('/admin/smtp', config)
    return response.data
  },

  /**
   * Test SMTP configuration by sending a test email
   */
  testConfig: async (to: string): Promise<{ success: boolean; message: string }> => {
    const response = await http.post('/admin/smtp/test', { to })
    return response.data
  },

  /**
   * Delete SMTP configuration (fallback to env vars)
   */
  deleteConfig: async (): Promise<{ success: boolean; message: string }> => {
    const response = await http.delete('/admin/smtp')
    return response.data
  },
}

