import { NotFoundError } from "blitz"
import db from "db"
import { assert } from "./assert"

export const ensureVenueRelatedToOrganization = <T extends Record<any, any>>(input: T): T => {
  assert(input.organizationId, "missing input.organizationId")
  assert(input.venueId, `missing input.venueId`)

  try {
    db.venue.findFirstOrThrow({
      where: {
        id: input.venueId,
        organizationId: input.organizationId,
      },
      select: { id: true },
    })
  } catch (e) {
    throw new NotFoundError("Could not find the venue in the organization")
  }

  return input
}
