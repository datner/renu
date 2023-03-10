import { resolver } from "@blitzjs/rpc"
import * as Effect from "@effect/io/Effect"
import { pipe } from "fp-ts/lib/function"
import { prismaError } from "src/core/helpers/prisma"
import { ofVenue } from "../helpers/query-filters"
import * as Management from "@integrations/management"
import * as Renu from "src/core/effect/runtime"
import db from "db"

// TODO: add caching again
export default resolver.pipe(resolver.authorize(), (_, ctx) =>
  pipe(
    Effect.tryCatchPromise(
      () => db.managementIntegration.findUniqueOrThrow({ where: ofVenue(ctx.session.venue.id) }),
      prismaError("ManagementIntegration")
    ),
    Effect.flatMap((int) =>
      Effect.all({
        integration: Effect.succeed(int),
        menu: Effect.provideService(Management.getVenueMenu, Management.Integration, int),
      })
    ),
    Renu.runPromise$
  )
)
