import http from '../lib/http'
import { BookingCreateForm } from '../lib/validators'

export interface Booking {
  id: string
  booking_ref: string
  supplier_booking_ref?: string
  source_id: string
  agreement_ref: string
  agent_booking_ref?: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  vehicle_info?: {
    vehicle_class: string
    vehicle_make_model: string
    rate_plan_code: string
    total_price: number
    currency: string
  }
  rental_details?: {
    pickup_location: string
    dropoff_location: string
    pickup_datetime: string
    dropoff_datetime: string
    driver_age: number
    residency_country: string
  }
  created_at: string
  updated_at: string
}

export interface BookingCreateRequest extends BookingCreateForm {
  source_id: string
  supplier_offer_ref?: string
  agent_booking_ref?: string
}

export interface BookingModifyRequest {
  agent_booking_ref?: string
  pickup_datetime?: string
  dropoff_datetime?: string
}

export interface BookingListResponse {
  data: Booking[]
  total: number
  page: number
  limit: number
}

export const bookingsApi = {
  create: async (data: BookingCreateRequest, idempotencyKey: string): Promise<Booking> => {
    const response = await http.post('/bookings', data, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    })
    return response.data
  },

  getBooking: async (bookingRef: string, sourceId: string): Promise<Booking> => {
    const response = await http.get(`/bookings/${bookingRef}`, {
      params: { source_id: sourceId },
    })
    return response.data
  },

  listBookings: async (params?: {
    status?: string
    source_id?: string
    page?: number
    limit?: number
  }): Promise<BookingListResponse> => {
    const response = await http.get('/bookings', { params })
    return response.data
  },

  modify: async (bookingRef: string, sourceId: string, data: BookingModifyRequest): Promise<Booking> => {
    const response = await http.patch(`/bookings/${bookingRef}`, data, {
      params: { source_id: sourceId },
    })
    return response.data
  },

  cancel: async (bookingRef: string, sourceId: string): Promise<Booking> => {
    const response = await http.post(`/bookings/${bookingRef}/cancel`, {}, {
      params: { source_id: sourceId },
    })
    return response.data
  },

  check: async (bookingRef: string, sourceId: string): Promise<Booking> => {
    const response = await http.post(`/bookings/${bookingRef}/check`, {}, {
      params: { source_id: sourceId },
    })
    return response.data
  },
}
