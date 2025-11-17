import http from '../lib/http'

export interface AvailabilityRequest {
  pickup_unlocode: string
  dropoff_unlocode: string
  pickup_iso: string
  dropoff_iso: string
  driver_age?: number
  residency_country?: string
  vehicle_classes?: string[]
  agreement_refs?: string[]
}

export interface AvailabilityResponse {
  request_id: string
  recommended_poll_ms: number
  status: 'PENDING' | 'COMPLETE' | 'ERROR'
}

export interface AvailabilityOffer {
  supplier_offer_ref: string
  source_id: string
  agreement_ref: string
  pickup_location: string
  dropoff_location: string
  vehicle_class: string
  vehicle_make_model: string
  rate_plan_code: string
  total_price: number
  currency: string
  availability_status: string
  supplier_name: string
}

export interface PollResponse {
  request_id: string
  status: 'PENDING' | 'COMPLETE' | 'ERROR'
  last_seq: number
  offers: AvailabilityOffer[]
  complete: boolean
  error?: string
}

export const availabilityApi = {
  submit: async (data: AvailabilityRequest): Promise<AvailabilityResponse> => {
    const response = await http.post('/availability/submit', data)
    return response.data
  },

  poll: async (params: {
    requestId: string
    sinceSeq?: number
    waitMs?: number
  }): Promise<PollResponse> => {
    const response = await http.get('/availability/poll', { params })
    return response.data
  },
}
