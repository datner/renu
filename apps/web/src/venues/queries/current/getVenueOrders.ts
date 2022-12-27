import { resolver } from "@blitzjs/rpc"
import { prismaNotFound } from "src/core/helpers/prisma"
import db, { Prisma } from "db"
import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { getSessionVenue } from "src/auth/helpers/fp/getSessionVenue"
import { AuthenticatedMiddlewareCtx, paginate } from "blitz"

interface GetVenueOrdersInput
  extends Pick<Prisma.OrderFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  (
    { where, orderBy, skip = 0, take = 100 }: GetVenueOrdersInput,
    ctx: AuthenticatedMiddlewareCtx
  ) =>
    pipe(
      getSessionVenue(ctx),
      TE.fromEither,
      TE.chainW(
        TE.tryCatchK(
          (venue) =>
            paginate({
              skip,
              take,
              count: () => db.order.count({ where: { ...where, venue } }),
              query: (args) => db.order.findMany({ where: { ...where, venue }, orderBy, ...args }),
            }),
          prismaNotFound
        )
      ),
      TE.map(({ items: orders, ...bag }) => ({ orders, ...bag }))
    )()
)
