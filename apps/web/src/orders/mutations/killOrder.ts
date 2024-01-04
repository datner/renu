import { Ctx } from "@blitzjs/next";
import db, { OrderState, Prisma } from "db";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";
import { inspect } from "util";

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
        try: () => db.order.updateMany({ where, data: { state: OrderState.Dead } }),
        catch: prismaError("Order"),
      })
    ),
    Effect.tapError((payload) => Effect.sync(() => console.log(inspect(payload)))),
    Effect.catchTag("PrismaError", (e) =>
      Effect.sync(() => {
        throw e.cause;
      })),
    Effect.tap((payload) => Effect.sync(() => console.log(inspect(payload, false, null, true)))),
    Session.authorize(ctx),
    Renu.runPromise$,
  );

export default killOrder;
