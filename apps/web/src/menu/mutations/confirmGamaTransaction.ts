import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Gama } from "@integrations/gama";
import { Presto } from "@integrations/presto";
import { OrderRepository } from "database-helpers/order";
import db, { OrderState } from "db";
import * as Telegram from "integrations/telegram";
import * as Message from "integrations/telegram/sendMessage";
import { Order } from "shared";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";

const ConfirmGamaTransaction = Schema.struct({
  jwt: Schema.string,
});

const confirmGamaTransaction = resolver.pipe(
  (i: Schema.From<typeof ConfirmGamaTransaction>) => Schema.decodeEffect(ConfirmGamaTransaction)(i),
  Effect.zip(Gama),
  Effect.flatMap(([{ jwt }, gama]) => gama.attachTxId(jwt)),
  Effect.map(order => order.id),
  Effect.zip(Presto),
  Effect.flatMap(([id, presto]) => presto.postOrder(id)),
  Effect.tap(Message.sendJson),
  Effect.provideService(OrderRepository, {
    getOrder: (orderId, args) =>
      pipe(
        Effect.tryCatchPromise(
          () => db.order.findUniqueOrThrow({ where: { id: orderId }, ...args }),
          prismaError("Order"),
        ),
        Effect.orDie,
      ) as any,
    setTransactionId: (orderId, txId) =>
      pipe(
        Effect.tryCatchPromise(
          () => db.order.update({ where: { id: orderId }, data: { txId, state: OrderState.PaidFor } }),
          prismaError("Order"),
        ),
        Effect.flatMap(Schema.decodeEffect(Order.Schema)),
        Effect.orDie,
      ),
  }),
  Effect.provideSomeLayer(Telegram.layer),
  Renu.runPromise$,
);

export default confirmGamaTransaction;
