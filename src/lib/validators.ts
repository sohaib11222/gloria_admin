import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const EndpointSchema = z.object({
  api_base_url: z.string().url('Invalid URL'),
})

export const WhitelistIPSchema = z.string().regex(
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  'Invalid IP address (IPv4 or IPv6)'
)

export const AvailabilitySchema = z.object({
  pickup_unlocode: z.string().min(1, 'Pickup location is required'),
  dropoff_unlocode: z.string().min(1, 'Dropoff location is required'),
  pickup_iso: z.string().min(1, 'Pickup date is required'),
  dropoff_iso: z.string().min(1, 'Dropoff date is required'),
})

export const BookingCreateSchema = z.object({
  agreement_ref: z.string().min(1, 'Agreement reference is required'),
  pickup_unlocode: z.string().min(1, 'Pickup location is required'),
  dropoff_unlocode: z.string().min(1, 'Dropoff location is required'),
  vehicle_class: z.string().min(1, 'Vehicle class is required'),
})

export const CompanyUpdateSchema = z.object({
  api_base_url: z.string().url().optional(),
  ip_whitelist: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
})

export const AgreementCreateSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  sourceId: z.string().min(1, 'Source ID is required'),
  agreementRef: z.string().min(1, 'Agreement reference is required'),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
})

export type LoginForm = z.infer<typeof LoginSchema>
export type EndpointForm = z.infer<typeof EndpointSchema>
export type CompanyUpdateForm = z.infer<typeof CompanyUpdateSchema>
export type AgreementCreateForm = z.infer<typeof AgreementCreateSchema>
export type AvailabilityForm = z.infer<typeof AvailabilitySchema>
export type BookingCreateForm = z.infer<typeof BookingCreateSchema>
