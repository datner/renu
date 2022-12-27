import { resolver } from "@blitzjs/rpc"
import { prismaNotFound } from "src/core/helpers/prisma"
import db from "db"
import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { getSessionVenue } from "src/auth/helpers/fp/getSessionVenue"

export default resolver.pipe(
  resolver.authorize(),
  (_, ctx) =>
    pipe(
      getSessionVenue(ctx),
      TE.fromEither,
      TE.chainW(
        TE.tryCatchK(
          (Venue) => db.managementIntegration.findFirstOrThrow({ where: { Venue } }),
          prismaNotFound
        )
      )
    ),
  (task) => task()
)
