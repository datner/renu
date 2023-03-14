import db from "db"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import { pipe } from "@effect/data/Function"
import { Ctx } from "@blitzjs/next"
import { Session } from "src/auth"
import * as _Menu from "src/menu/schema"
import { prismaError } from "src/core/helpers/prisma"
import { Renu } from "src/core/effect"

const _removeCategory = (id: _Menu.CategoryId, ctx: Ctx) =>
  pipe(
    Session.ensureSuperAdmin,
    Effect.flatMap(() =>
      Effect.attemptCatchPromise(
        () =>
          db.category.update({
            where: { id },
            data: { deleted: new Date() },
          }),
        prismaError("Category")
      )
    ),
    Session.authorize(ctx),
    Effect.tapError((c) => Effect.sync(() => console.log((c as Error).cause))),
    Effect.tapErrorCause((c) => Effect.sync(() => console.log(Cause.pretty(c)))),
    Renu.runPromise$
  )

export default _removeCategory
