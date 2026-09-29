import { z } from "zod";

export const MAX_TICKETS_PER_ORDER = 6;

const rectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const zoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  kind: z.enum(["seated", "general"]),
  status: z.enum(["available", "low-stock", "sold-out"]),
  shape: rectSchema,
});

export const seatSchema = z.object({
  id: z.string().min(1),
  zoneId: z.string().min(1),
  row: z.string().length(1),
  number: z.number().int().positive(),
  x: z.number(),
  y: z.number(),
  status: z.enum(["available", "occupied"]),
});

export const venueMapSchema = z.object({
  name: z.string().min(1),
  viewBox: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  stage: rectSchema,
  zones: zoneSchema.array().min(1),
  seats: seatSchema.array(),
});

export type Zone = z.infer<typeof zoneSchema>;
export type Seat = z.infer<typeof seatSchema>;
export type VenueMap = z.infer<typeof venueMapSchema>;
