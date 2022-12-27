import { resolver } from "@blitzjs/rpc"
import { NotFoundError } from "blitz"
import db from "db"
import { z } from "zod"

const GetOrganization = z.object({
  // This accepts type of undefined, but is required at runtime
  id: z.number().optional().refine(Boolean, "Required"),
})

export default resolver.pipe(
  resolver.zod(GetOrganization),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const organization = await db.organization.findFirst({ where: { id } })

    if (!organization) throw new NotFoundError()

    return organization
  }
)
