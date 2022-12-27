import { resolver } from "@blitzjs/rpc"
import { setDefaultOrganizationId } from "src/auth/helpers/setDefaultOrganizationId"
import * as TE from "fp-ts/TaskEither"
import { z } from "zod"
import db from "db"
import { prismaNotFound } from "src/core/helpers/prisma"
import { pipe } from "fp-ts/lib/function"

const ChangeVenue = z.number()

export default resolver.pipe(
  resolver.zod(ChangeVenue),
  resolver.authorize(),
  (id) => ({ id }),
  setDefaultOrganizationId,
  (where, ctx) =>
    pipe(
      TE.tryCatch(() => db.venue.findFirstOrThrow({ where }), prismaNotFound),
      TE.chainTaskK((venue) => () => ctx.session.$setPublicData({ venue: venue }))
    )()
)
