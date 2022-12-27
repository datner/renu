import { z } from "zod"

export const Query = z
  .object({
    restaurant: z.string(),
    table: z.string().default("bar"),
  })
  .default({ restaurant: "none", table: "bar" })
