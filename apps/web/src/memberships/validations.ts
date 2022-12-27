import { z } from "zod"

export const InviteMemberSchema = z.object({
  organization: z.string(),
  name: z.string(),
  email: z.string().email(),
  venue: z.string().optional(),
})
