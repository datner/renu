import { z } from "zod"
import { BaseEntity, IdOrSlug } from "src/core/helpers/zod"
import { Slug } from "src/auth/validations"

export const CreateOrganizationSchema = z.object({
  identifier: Slug,
  name: z.string(),
  userId: z.number(),
})

export const OrganizationSchema = BaseEntity.extend({ name: z.string().min(1) })

export const CreateOrganization = OrganizationSchema.pick({ name: true, identifier: true })
export const UpdateOrganization = CreateOrganization
export const DeleteOrganization = IdOrSlug
