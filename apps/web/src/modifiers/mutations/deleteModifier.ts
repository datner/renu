import { Ctx } from "@blitzjs/next";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import db, { Prisma } from "db";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";

// TODO: change to branded type
const killOrder = (orderId: number, ctx: Ctx) =>
  pipe(
    Session.ensureOrgVenueMatch,
    Effect.flatMap(() =>
      Session.with(
        (s) => ({
          venue: { id: s.venue.id },
          id: orderId,
        } satisfies Prisma.OrderWhereInput),
      )
    ),
    Effect.flatMap((where) =>
      Effect.tryPromise({
        try: () => db.itemModifier.updateMany({ where, data: { deleted: new Date() } }),
        catch: prismaError("Order"),
      })
    ),
    Effect.catchTag("PrismaError", (e) =>
      Effect.sync(() => {
        throw e.cause;
      })),
    Session.authorize(ctx),
    Renu.runPromise$,
  );

export default killOrder;
