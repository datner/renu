import { NotFoundError } from "blitz"
import { Affiliation, GlobalRole, Membership, Organization, Venue } from "db"
import { head } from "fp-ts/Array"
import { pipe } from "fp-ts/function"
import * as E from "fp-ts/Either"
import { IO } from "fp-ts/lib/IO"

export const getMembership = (user: {
  id: number
  role: GlobalRole
  membership: (Membership & {
    affiliations: (Affiliation & { Venue: Venue })[]
    organization: Organization
  })[]
}) => {
  const noOrg: IO<NotFoundError> = () =>
    new NotFoundError(`User ${user.id} is not associated with any organizations`)

  const noVenue: IO<NotFoundError> = () =>
    new NotFoundError(`User ${user.id} is not affiliated with any venues`)

  return pipe(
    head(user.membership),
    E.fromOption(noOrg),
    E.bind(
      "affiliation",
      E.fromOptionK(noVenue)(({ affiliations }) => head(affiliations))
    )
  )
}
