import db, { Prisma } from "db"
import * as Effect from "@effect/io/Effect"
import * as A from "@effect/data/ReadonlyArray"
import * as S from "@effect/schema/Schema"
import * as P from "@effect/schema/Parser"
import { pipe } from "@effect/data/Function"
import { Ctx } from "@blitzjs/next"
import { Session } from "src/auth"
import { Number } from "shared/branded"
import { Renu, Server } from "src/core/effect"
import { prismaError } from "src/core/helpers/prisma"
import { inspect } from "util"
import { Modifiers } from "database-helpers"

interface GetCategoriesArgs
  extends Pick<Prisma.OrderFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

const Max250Int = pipe(
  S.number,
  S.fromBrand(Number.PositiveInt),
  S.lessThanOrEqualTo(250),
  S.brand("Max250Int")
)

const handler = ({ skip = 0, take = 50, orderBy, where }: GetCategoriesArgs, ctx: Ctx) =>
  pipe(
    Session.ensureOrgVenuMatch,
    Effect.flatMap(() =>
      Session.with(
        (s) =>
          ({
            venue: { id: s.venue.id },
            ...where,
          } satisfies Prisma.OrderWhereInput)
      )
    ),
    Effect.flatMap((where) =>
      Server.paginate(Number.NonNegativeInt, Max250Int)(
        (skip, take) =>
          Effect.attemptCatchPromise(
            () =>
              db.order.findMany({
                skip,
                take,
                include: {
                  items: {
                    include: {
                      item: {
                        include: { content: true },
                      },
                      modifiers: { include: { modifier: true } },
                    },
                  },
                },
                where,
                orderBy,
              }),
            prismaError("Order")
          ),
        Effect.map(
          Effect.attemptCatchPromise(() => db.order.count({ where }), prismaError("Category")),
          Number.NonNegativeInt
        )
      )(skip, take)
    ),
    Effect.map((bag) => ({
      orders: A.map(A.fromIterable(bag.items), (order) => ({
        ...order,
        items: A.map(order.items, (it) => ({
          ...it,
          modifiers: A.map(it.modifiers, (mod) => ({
            ...mod,
            modifier: {
              ...mod.modifier,
              config: P.parse(Modifiers.ModifierConfig)(mod.modifier.config),
            },
          })),
        })),
      })),
      nextPage: bag.nextPage,
      hasMore: bag.hasMore,
      count: bag.count,
    })),
    Effect.tapError((payload) => Effect.sync(() => console.log(inspect(payload)))),
    Effect.catchTag("PrismaError", (e) =>
      Effect.sync(() => {
        throw e.cause
      })
    ),
    Effect.tap((payload) => Effect.sync(() => console.log(inspect(payload, false, null, true)))),
    Session.authorize(ctx),
    Renu.runPromise$
  )

export default handler
