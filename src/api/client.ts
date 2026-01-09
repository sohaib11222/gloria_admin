import { httpClient } from './http.js'
import { MW } from './routes.js'

// Types
export interface UiConfig {
  features: {
    whitelist?: boolean
    metrics?: boolean
    verification?: boolean
    grpcTesting?: boolean
  }
  defaults: {
    sourceGrpcAddr?: string
    agentGrpcAddr?: string
    sourceHttpUrl?: string
    agentHttpUrl?: string
  }
}

export interface HealthResponse {
  status: string
  timestamp: string
  services?: Record<string, any>
}

export interface TestResult {
  success: boolean
  message?: string
  responseTime?: number
  error?: string
}

export interface Location {
  unlocode: string
  name: string
  country: string
  city?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface AvailabilityRequest {
  pickup_unlocode: string
  dropoff_unlocode: string
  pickup_iso: string
  dropoff_iso: string
  driver_age?: number
  residency_country?: string
  vehicle_classes?: string[]
  agreement_refs?: string[]
  addr?: string
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

export interface AvailabilityResponse {
  request_id: string
  recommended_poll_ms: number
  status: 'PENDING' | 'COMPLETE' | 'ERROR'
  offers?: AvailabilityOffer[]
}

export interface BookingCreateRequest {
  source_id: string
  supplier_offer_ref?: string
  agent_booking_ref?: string
  pickup_datetime: string
  dropoff_datetime: string
  driver_age: number
  residency_country: string
  pickup_location: string
  dropoff_location: string
  vehicle_class: string
  vehicle_make_model: string
  rate_plan_code: string
  total_price: number
  currency: string
  addr?: string
}

export interface BookingModifyRequest {
  booking_ref: string
  agent_booking_ref?: string
  pickup_datetime?: string
  dropoff_datetime?: string
  addr?: string
}

export interface BookingCancelRequest {
  booking_ref: string
  addr?: string
}

export interface BookingCheckRequest {
  booking_ref: string
  addr?: string
}

export interface AgentTokenResponse {
  token?: string
  expires_at?: string
}

export interface AgreementTemplate {
  title: string
  content: string
  version: string
}

export interface AgreementStatus {
  accepted: boolean
  version: string
  accepted_at?: string
}

// Client functions
export async function getUiConfig(): Promise<UiConfig> {
  try {
    return await httpClient.get<UiConfig>(MW.uiConfig())
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error.status === 404 || error.status === 501)) {
      // Return default config if endpoint not available
      return {
        features: {
          whitelist: false,
          metrics: false,
          verification: false,
          grpcTesting: true,
        },
        defaults: {
          sourceGrpcAddr: 'localhost:51061',
          agentGrpcAddr: 'localhost:51062',
          sourceHttpUrl: 'http://localhost:9090',
          agentHttpUrl: 'http://localhost:9091',
        },
      }
    }
    throw error
  }
}

export async function testSourceGrpc(addr?: string): Promise<TestResult> {
  const startTime = Date.now()
  try {
    const response = await httpClient.post(MW.testSourceGrpc(), { addr })
    return {
      success: response.ok !== false,
      message: response.ok !== false ? 'Source gRPC test successful' : 'Source gRPC test failed',
      responseTime: Date.now() - startTime,
      error: response.ok === false ? response.error : undefined,
    }
  } catch (error: any) {
    // Extract error message from response data if available
    const errorMessage = error?.data?.error || error?.message || 'Unknown error'
    return {
      success: false,
      message: 'Source gRPC test failed',
      responseTime: Date.now() - startTime,
      error: errorMessage,
    }
  }
}

export async function testAgentGrpc(addr?: string): Promise<TestResult> {
  const startTime = Date.now()
  try {
    const response = await httpClient.post(MW.testAgentGrpc(), { addr })
    return {
      success: response.ok !== false,
      message: response.ok !== false ? 'Agent gRPC test successful' : 'Agent gRPC test failed',
      responseTime: Date.now() - startTime,
      error: response.ok === false ? response.error : undefined,
    }
  } catch (error: any) {
    // Extract error message from response data if available
    const errorMessage = error?.data?.error || error?.message || 'Unknown error'
    return {
      success: false,
      message: 'Agent gRPC test failed',
      responseTime: Date.now() - startTime,
      error: errorMessage,
    }
  }
}


export async function createBooking(_payload: BookingCreateRequest): Promise<any> {
  throw new Error('Booking functionality not available - source testing has been removed')
}

export async function modifyBooking(_payload: BookingModifyRequest): Promise<any> {
  throw new Error('Booking functionality not available - source testing has been removed')
}

export async function cancelBooking(_payload: BookingCancelRequest): Promise<any> {
  throw new Error('Booking functionality not available - source testing has been removed')
}

export async function checkBooking(_payload: BookingCheckRequest): Promise<any> {
  throw new Error('Booking functionality not available - source testing has been removed')
}

export async function agentPing(addr?: string): Promise<TestResult> {
  const startTime = Date.now()
  try {
    await httpClient.post(MW.agent.ping(), { addr })
    return {
      success: true,
      message: 'Agent ping successful',
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error.status === 404 || error.status === 501)) {
      return {
        success: false,
        message: 'Agent ping wrapper not available',
        responseTime: Date.now() - startTime,
        error: 'Wrapper not available on server',
      }
    }
    return {
      success: false,
      message: 'Agent ping failed',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function agentRunCheck(payload: any, addr?: string): Promise<TestResult> {
  const startTime = Date.now()
  try {
    await httpClient.post(MW.agent.runCheck(), { ...payload, addr })
    return {
      success: true,
      message: 'Agent run check successful',
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error.status === 404 || error.status === 501)) {
      return {
        success: false,
        message: 'Agent run check wrapper not available',
        responseTime: Date.now() - startTime,
        error: 'Wrapper not available on server',
      }
    }
    return {
      success: false,
      message: 'Agent run check failed',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getAgentToken(): Promise<AgentTokenResponse> {
  try {
    return await httpClient.get<AgentTokenResponse>(MW.agent.tokenGet())
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error.status === 404 || error.status === 501)) {
      // Return empty response if endpoint not available
      return {}
    }
    throw error
  }
}

export async function setAgentToken(token: string): Promise<void> {
  try {
    await httpClient.post(MW.agent.tokenPost(), { token })
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error.status === 404 || error.status === 501)) {
      // Just store locally if server endpoint not available
      localStorage.setItem('agent.token', token)
      return
    }
    throw error
  }
}

export async function deleteAgentToken(): Promise<void> {
  try {
    await httpClient.delete(MW.agent.tokenDel())
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error.status === 404 || error.status === 501)) {
      // Just remove from local storage if server endpoint not available
      localStorage.removeItem('agent.token')
      return
    }
    throw error
  }
}

// Agreements
export async function getAgreementTemplate(): Promise<AgreementTemplate> {
  try {
    return await httpClient.get<AgreementTemplate>(MW.agreementsTemplate.get())
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error.status === 404 || error.status === 501)) {
      // Return default template
      return {
        title: 'Terms of Service',
        content: 'Default agreement terms...',
        version: '1.0',
      }
    }
    throw error
  }
}

export async function acceptAgreement(): Promise<void> {
  try {
    await httpClient.post(MW.agreementsTemplate.accept(), {})
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error.status === 404 || error.status === 501)) {
      // Just store locally if server endpoint not available
      localStorage.setItem('agreements.accepted', 'true')
      return
    }
    throw error
  }
}

export async function getAgreementStatus(): Promise<AgreementStatus> {
  try {
    return await httpClient.get<AgreementStatus>(MW.agreementsTemplate.status())
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error.status === 404 || error.status === 501)) {
      // Check local storage
      const accepted = localStorage.getItem('agreements.accepted') === 'true'
      return {
        accepted,
        version: '1.0',
        accepted_at: accepted ? new Date().toISOString() : undefined,
      }
    }
    throw error
  }
}
