import { prismaError } from "src/core/helpers/prisma"
import db, { ManagementIntegration } from "db"
import { pipe } from "@effect/data/Function"
import * as Effect from "@effect/io/Effect"
import { Ctx } from "@blitzjs/next"
import * as Renu from "src/core/effect/runtime"
import { inspect } from "util"
import { Session } from "src/auth"

const handler = (_: null, ctx: Ctx) =>
  pipe(
    Session.with((session) => session.venue),
    Effect.tap((a) => Effect.log(inspect(a))),
    Effect.flatMap((venue) =>
      Effect.attemptCatchPromise(
        () => db.managementIntegration.findFirstOrThrow({ where: { Venue: { id: venue.id } } }),
        prismaError("ManagementIntegration")
      )
    ),
    Effect.catchTag("PrismaError", (_) =>
      Session.withEffect((session) =>
        Effect.cond(
          () => _.options.resource === "ManagementIntegration" && !_.isValidationError,
          (): ManagementIntegration => ({
            id: -1,
            vendorData: {},
            venueId: session.venue.id,
            provider: "RENU",
          }),
          () => _
        )
      )
    ),
    Session.authorize(ctx),
    Renu.runPromise$
  )
export default handler
