import db, { Prisma } from "db"
import * as Effect from "@effect/io/Effect"
import { pipe } from "@effect/data/Function"
import { Ctx } from "@blitzjs/next"
import { Session } from "src/auth"
import { Renu } from "src/core/effect"
import { prismaError } from "src/core/helpers/prisma"

// TODO: change to branded type
const killOrder = (orderId: number, ctx: Ctx) =>
  pipe(
    Session.ensureOrgVenuMatch,
    Effect.flatMap(() =>
      Session.with(
        (s) =>
          ({
            venue: { id: s.venue.id },
            id: orderId,
          } satisfies Prisma.OrderWhereInput)
      )
    ),
    Effect.flatMap((where) =>
      Effect.attemptCatchPromise(
        () => db.itemModifier.updateMany({ where, data: { deleted: new Date() } }),
        prismaError("Order")
      )
    ),
    Effect.catchTag("PrismaError", (e) =>
      Effect.sync(() => {
        throw e.cause
      })
    ),
    Session.authorize(ctx),
    Renu.runPromise$
  )

export default killOrder
