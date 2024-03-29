import { Management } from "@integrations/core";
import { ManagementProvider, OrderState } from "database";
import { PrismaClient } from "database";
import { Context, Effect, Layer } from "effect";

// add prisma to the NodeJS global type
declare global {
  var __db: PrismaClient;
}

interface RenuService extends Management.ManagementService {
  _tag: typeof ManagementProvider.RENU;
}
export const Tag = Context.Tag<RenuService>();

export const layer = Layer.sync(Tag, () => ({
  _tag: ManagementProvider.RENU,
  // on payment
  reportOrder: (order) =>
    Effect.promise(() =>
      // This is stolen from the app
      global.__db.order.update({
        where: { id: order.id },
        data: {
          state: OrderState.Confirmed,
        },
      })
    ).pipe(
      Effect.asUnit,
    ),

  // on success page
  getOrderStatus: (order) =>
    Effect.succeed(order.state === OrderState.Unconfirmed ? OrderState.Confirmed : order.state),

  // in admin dashboard
  getVenueMenu: Effect.succeed({ name: "unknown", categories: [] }),
}));
