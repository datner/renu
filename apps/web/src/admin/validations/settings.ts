import { z } from "zod"

export const Settings = z.object({
  address: z.string().trim().min(3),
  phone: z
    .string()
    .trim()
    .regex(/\d{2,3}-?\d{3,}-?\d+/)
    .min(9)
    .max(12),
})
