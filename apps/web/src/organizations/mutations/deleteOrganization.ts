import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"

const DeleteOrganization = z.object({
  id: z.number(),
})

export default resolver.pipe(
  resolver.zod(DeleteOrganization),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const organization = await db.organization.deleteMany({ where: { id } })

    return organization
  }
)
