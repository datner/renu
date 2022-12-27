import { z } from "zod"

export const CreateClientSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})
