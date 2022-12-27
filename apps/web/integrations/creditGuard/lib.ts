import { z } from "zod"

export const Credentials = z.object({
  username: z.string(),
  password: z.string(),
  mid: z.string(),
})

export type Credentials = z.infer<typeof Credentials>
