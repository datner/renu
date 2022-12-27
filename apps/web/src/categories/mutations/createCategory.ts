import { resolver } from "@blitzjs/rpc"
import { setDefaultOrganizationIdNoFilter } from "src/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenue } from "src/auth/helpers/setDefaultVenue"
import { revalidateVenue } from "src/core/helpers/revalidation"
import db from "db"
import { CreateCategory } from "../validations"

export default resolver.pipe(
  resolver.zod(CreateCategory),
  resolver.authorize(),
  setDefaultOrganizationIdNoFilter,
  setDefaultVenue,
  async ({ organizationId, venue, ...input }) => {
    const item = await db.category.create({
      data: {
        ...input,
        venueId: venue.id,
        organizationId,
      },
      include: {
        content: true,
      },
    })

    await revalidateVenue(venue.identifier)()

    return item
  }
)
