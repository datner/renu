import { Ctx } from "@blitzjs/next";
import * as S from "@effect/schema/Schema";
import { Modifiers } from "database-helpers";
import db, { Prisma } from "db";
import { Effect, pipe, ReadonlyArray as A } from "effect";
import { Number } from "shared/branded";
import { Common } from "shared/schema";
import { Session } from "src/auth";
import { Renu, Server } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";
import { inspect } from "util";

interface GetCategoriesArgs extends Pick<Prisma.OrderFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

const Max250Int = pipe(
  S.number,
  S.fromBrand(Number.PositiveInt),
  S.lessThanOrEqualTo(250),
  S.brand("Max250Int"),
);

const handler = ({ skip = 0, take = 50, orderBy, where }: GetCategoriesArgs, ctx: Ctx) =>
  pipe(
    Session.ensureOrgVenueMatch,
    Effect.flatMap(() =>
      Session.with(
        (s) => ({
          venue: { id: s.venue.id },
          ...where,
        } satisfies Prisma.OrderWhereInput),
      )
    ),
    Effect.flatMap((where) =>
      Server.paginate(Number.NonNegativeInt, Max250Int)(
        (skip, take) =>
          Effect.tryPromise({
            try: () =>
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
            catch: prismaError("Order"),
          }),
        Effect.map(
          Effect.tryPromise({ try: () => db.order.count({ where }), catch: prismaError("Category") }),
          Number.NonNegativeInt,
        ),
      )(skip, take)
    ),
    Effect.map((bag) => ({
      orders: A.map(A.fromIterable(bag.items), (order) => ({
        ...order,
        items: A.map(order.items, (it) => ({
          ...it,
          item: {
            ...it.item,
            content: S.decodeSync(S.array(Common.Content))(it.item.content),
          },
          modifiers: A.map(it.modifiers, (mod) => ({
            ...mod,
            modifier: {
              ...mod.modifier,
              config: S.parseSync(Modifiers.ModifierConfig)(mod.modifier.config),
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
        throw e.cause;
      })),
    Effect.tap((payload) => Effect.sync(() => console.log(inspect(payload, false, null, true)))),
    Session.authorize(ctx),
    Renu.runPromise$,
  );

export default handler;
