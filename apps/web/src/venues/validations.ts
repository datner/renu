import { Id, Slug } from "src/core/helpers/zod"
import { z } from "zod"

const Content = z.object({
  name: z.string(),
})

export const CreateVenueSchema = z.object({
  identifier: Slug,
  logo: z.string(),
  organizationId: Id,
  memberId: Id,
  he: Content,
  en: Content,
})
