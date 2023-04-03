import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Presto } from "@integrations/presto";
import { OrderRepository } from "database-helpers/order";
import db, { OrderState } from "db";
import * as Message from "integrations/telegram/sendMessage";
import * as Telegram from "integrations/telegram";
import { Order } from "shared";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";

const SendPrestoJson = Schema.struct({
  id: Order.Id,
});

const sendPrestoJson = resolver.pipe(
  (i: Schema.From<typeof SendPrestoJson>) => Schema.decodeEffect(SendPrestoJson)(i),
  Effect.zip(Presto),
  Effect.flatMap(([{id}, presto]) => presto.postOrder(id)),
  Effect.tap(o => Message.sendJson(o)),
  Effect.provideService(OrderRepository, {
    getOrder: (orderId, args) =>
      pipe(
        Effect.tryCatchPromise(
          () => db.order.findUniqueOrThrow({ where: { id: orderId }, ...args }) ,
          prismaError("Order"),
        ),
        Effect.orDie,
      ) as any,
    setTransactionId: (orderId, txId) => 
      pipe(
        Effect.tryCatchPromise(
          () => db.order.update({ where: { id: orderId }, data: {txId, state: OrderState.PaidFor} }),
          prismaError("Order"),
        ),
        Effect.flatMap(Schema.decodeEffect(Order.Schema)),
        Effect.orDie,
      )
  }),
  Effect.provideSomeLayer(Telegram.layer),
  Renu.runPromise$
);

export default sendPrestoJson

