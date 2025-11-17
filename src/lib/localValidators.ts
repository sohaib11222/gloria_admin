import { z } from 'zod'

export const SourceHealthSchema = z
  .object({
    ok: z.boolean().optional(),
    status: z.string().optional(),
  })
  .passthrough()

export const SourceLocationsSchema = z.array(
  z
    .object({
      LocationCode: z.string(),
      LocationName: z.string(),
    })
    .passthrough()
)

export const SourceAvailabilityItemSchema = z
  .object({
    PickupLocation: z.string(),
    DropOffLocation: z.string(),
    VehicleClass: z.string(),
    RatePlanCode: z.string(),
    AvailabilityStatus: z.string(),
  })
  .passthrough()

export const SourceAvailabilitySchema = z.array(SourceAvailabilityItemSchema)

export const SourceBookingRefSchema = z
  .object({
    BookingReference: z.string(),
    Status: z.string(),
  })
  .passthrough()

export const AgentHealthSchema = z
  .object({
    ok: z.boolean().optional(),
    tokenConfigured: z.boolean().optional(),
    middleware: z.string().optional(),
  })
  .passthrough()

export const AgentTestSchema = z.any()

export const safeParse = <T>(schema: z.ZodTypeAny, data: unknown) => {
  const r = schema.safeParse(data)
  return { ok: r.success, issues: r.success ? [] : r.error.issues }
}


