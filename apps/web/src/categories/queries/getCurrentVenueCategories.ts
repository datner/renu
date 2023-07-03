import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";
import db, { Prisma } from "db";
import { Number } from "shared/branded";
import { Resolver } from "src/auth";
import { Renu, Server } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";

interface GetCategoriesArgs extends Pick<Prisma.CategoryFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

const Max250Int = pipe(
  S.number,
  S.fromBrand(Number.PositiveInt),
  S.lessThanOrEqualTo(250),
  S.brand("Max250Int"),
);

const handler = resolver.pipe(
  ({ skip = 0, take = 50, ..._ }: GetCategoriesArgs) => Effect.succeed({ skip, take, ..._ }),
  Resolver.authorize(),
  Resolver.flatMapAuthorized(Resolver.esnureOrgVenueMatch),
  Resolver.map(({ where, ..._ }, ctx) => ({
    ..._,
    where: {
      venueId: ctx.session.venue.id,
      organizationId: ctx.session.organization.id,
      deleted: null,
      ...where,
    },
  })),
  Resolver.flatMap(({ where, orderBy = {}, skip, take }) =>
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
          prismaError("Category"),
        ),
      Effect.map(
        Effect.tryCatchPromise(() => db.category.count({ where }), prismaError("Category")),
        Number.NonNegativeInt,
      ),
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
  Renu.runPromise$,
);

export default handler;
