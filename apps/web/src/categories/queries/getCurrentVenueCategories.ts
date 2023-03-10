import db, { Prisma } from "db"
import * as Effect from "@effect/io/Effect"
import * as A from "@effect/data/ReadonlyArray"
import * as S from "@effect/schema/Schema"
import * as SB from "@effect/schema/data/Brand"
import { pipe } from "@effect/data/Function"
import { Ctx } from "@blitzjs/next"
import { Session } from "src/auth"
import { Number } from "shared/branded"
import { Renu, Server } from "src/core/effect"
import { prismaError } from "src/core/helpers/prisma"

interface GetCategoriesArgs
  extends Pick<Prisma.CategoryFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

const Max250Int = pipe(
  S.number,
  SB.brand(Number.PositiveInt),
  S.lessThanOrEqualTo(250),
  S.brand("Max250Int")
)

const handler = ({ skip = 0, take = 50, orderBy, where }: GetCategoriesArgs, ctx: Ctx) =>
  pipe(
    Session.ensureOrgVenuMatch,
    Effect.flatMap(() =>
      Session.with((s) => ({
        venueId: s.venue.id,
        organizationId: s.organization.id,
        deleted: null,
        ...where,
      }))
    ),
    Effect.flatMap((where) =>
      Server.paginate(Number.NonNegativeInt, Max250Int)(
        (skip, take) =>
          Effect.tryCatchPromise(
            () =>
              db.category.findMany({
                skip,
                take,
                include: {
                  content: true,
                  categoryItems: {
                    orderBy: { position: Prisma.SortOrder.asc },
                    where: {
                      Item: { deleted: null },
                    },
                    include: {
                      Item: {
                        include: {
                          content: true,
                        },
                      },
                    },
                  },
                },
                where,
                orderBy,
              }),
            prismaError("Category")
          ),
        Effect.map(
          Effect.tryCatchPromise(() => db.category.count({ where }), prismaError("Category")),
          Number.NonNegativeInt
        )
      )(skip, take)
    ),
    Effect.map((bag) => ({
      categories: A.map(A.fromIterable(bag.items), (it) => ({
        ...it,
        items: A.map(it.categoryItems, (ci) => ci.Item),
      })),
      nextPage: bag.nextPage,
      hasMore: bag.hasMore,
      count: bag.count,
    })),
    Session.authorize(ctx),
    Renu.runPromise$
  )

export default handler
