import { resolver } from "@blitzjs/rpc"
import { enforceSuperAdminIfNotCurrentOrganization } from "src/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { setDefaultOrganizationId } from "src/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenue } from "src/auth/helpers/setDefaultVenue"
import { revalidateVenue } from "src/core/helpers/revalidation"
import db from "db"
import { z } from "zod"

const DeleteItem = z.object({
  id: z.number(),
})

export default resolver.pipe(
  resolver.zod(DeleteItem),
  resolver.authorize(),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  setDefaultVenue,
  async ({ id, venue }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const item = await db.item.deleteMany({ where: { id } })
    await revalidateVenue(venue.identifier)()
    return item
  }
)
