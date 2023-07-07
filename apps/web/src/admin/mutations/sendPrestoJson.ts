import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Presto } from "@integrations/presto";
import { OrderRepository } from "database-helpers/order";
import db, { OrderState } from "db";
import * as Message from "integrations/telegram/sendMessage";
import { Order } from "shared";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";

const SendPrestoJson = Schema.struct({
  id: Order.Id,
});

const sendPrestoJson = resolver.pipe(
  Resolver.schema(SendPrestoJson),
  Effect.zip(Presto),
  Effect.flatMap(([{ id }, presto]) => presto.postOrder(id)),
  Effect.tap(o => Message.sendJson(o)),
  Effect.provideService(OrderRepository, {
    getOrder: (orderId, args) =>
      pipe(
        Effect.tryPromise({
          try: () => db.order.findUniqueOrThrow({ where: { id: orderId }, ...args }),
          catch: prismaError("Order"),
        }),
        Effect.orDie,
      ) as any,
    setTransactionId: (orderId, txId) =>
      pipe(
        Effect.tryPromise({
          try: () => db.order.update({ where: { id: orderId }, data: { txId, state: OrderState.PaidFor } }),
          catch: prismaError("Order"),
        }),
        Effect.flatMap(Schema.decode(Order.Schema)),
        Effect.orDie,
      ),
  }),
  Renu.runPromise$,
);

export default sendPrestoJson;
