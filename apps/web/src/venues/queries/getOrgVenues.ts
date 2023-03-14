import { resolver } from "@blitzjs/rpc"
import * as Effect from "@effect/io/Effect"
import db from "db"
import { prismaError } from "src/core/helpers/prisma"

export default resolver.pipe(resolver.authorize(), (_, ctx) =>
  Effect.runPromise(
    Effect.attemptCatchPromise(
      () =>
        db.venue.findMany({
          where: { organizationId: ctx.session.organization.id },
          include: { content: true },
        }),
      prismaError("Venue")
    )
  )
)
