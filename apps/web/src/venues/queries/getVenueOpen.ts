import { resolver } from "@blitzjs/rpc"
import { pipe } from "fp-ts/function"
import * as T from "fp-ts/Task"
import * as TE from "fp-ts/TaskEither"
import { venueFindFirst } from "../helpers/prisma"
import { belongsToOrg, isVenue } from "../helpers/queryFilters"

export default resolver.pipe(resolver.authorize(), (_, ctx) =>
  pipe(
    venueFindFirst({
      where: {
        AND: [belongsToOrg(ctx.session.organization.id), isVenue(ctx.session.venue.id)],
      },
    }),
    TE.map(({ open }) => ({ open })),
    TE.getOrElse(() => T.of({ open: false }))
  )()
)
