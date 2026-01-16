import http from '../lib/http'

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type MessageSenderType = 'ADMIN' | 'AGENT' | 'SOURCE'

export interface SupportTicket {
  id: string
  title: string
  status: SupportTicketStatus
  createdById: string
  createdBy: {
    id: string
    companyName: string
    type: 'AGENT' | 'SOURCE'
    email: string
  }
  assignedTo?: string | null
  createdAt: string
  updatedAt: string
  unreadCount?: number
  lastMessage?: SupportMessage | null
  messageCount?: number
}

export interface SupportMessage {
  id: string
  ticketId: string
  senderId: string
  senderType: MessageSenderType
  content?: string | null
  imageUrl?: string | null
  readAt?: string | null
  createdAt: string
}

export interface CreateTicketRequest {
  title: string
  initialMessage?: string
}

export interface UpdateTicketRequest {
  status?: SupportTicketStatus
  assignedTo?: string | null
}

export interface SendMessageRequest {
  content?: string
  image?: File
}

export interface TicketsResponse {
  items: SupportTicket[]
  total: number
}

export interface MessagesResponse {
  items: SupportMessage[]
  total: number
}

export const supportApi = {
  getTickets: async (params?: { status?: SupportTicketStatus; companyType?: 'AGENT' | 'SOURCE' }): Promise<TicketsResponse> => {
    const response = await http.get('/api/support/tickets', { params })
    return response.data
  },

  getTicket: async (id: string): Promise<SupportTicket> => {
    const response = await http.get(`/api/support/tickets/${id}`)
    return response.data
  },

  updateTicket: async (id: string, data: UpdateTicketRequest): Promise<SupportTicket> => {
    const response = await http.put(`/api/support/tickets/${id}`, data)
    return response.data
  },

  getMessages: async (ticketId: string): Promise<MessagesResponse> => {
    const response = await http.get(`/api/support/tickets/${ticketId}/messages`)
    return response.data
  },

  sendMessage: async (ticketId: string, data: SendMessageRequest): Promise<SupportMessage> => {
    const formData = new FormData()
    
    // ALWAYS append content - if provided, use it; if image-only, use empty string
    // This ensures backend always receives a content field
    if (data.content !== undefined && data.content !== null) {
      formData.append('content', data.content)
    } else if (data.image) {
      // If we have image but no content, send empty string to satisfy backend requirement
      formData.append('content', '')
    }
    
    // Append image if provided - this is critical for image-only messages
    if (data.image) {
      formData.append('image', data.image)
    }

    // Don't set Content-Type header - axios will set it automatically with boundary for FormData
    // This ensures Authorization header is properly included
    const response = await http.post(`/api/support/tickets/${ticketId}/messages`, formData)
    return response.data
  },

  markMessageRead: async (ticketId: string, messageId: string): Promise<void> => {
    await http.post(`/api/support/tickets/${ticketId}/messages/${messageId}/read`)
  },
}
