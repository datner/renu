import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Gama, OrderRepository } from "@integrations/gama";
import db, { OrderState } from "db";
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
  Effect.provideService(OrderRepository, {
    getOrder: (orderId) =>
      pipe(
        Effect.tryCatchPromise(
          () => db.order.findUniqueOrThrow({ where: { id: orderId } }),
          prismaError("Order"),
        ),
        Effect.flatMap(Schema.decodeEffect(Order.Schema)),
        Effect.orDie,
      ),
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
  Renu.runPromise$
);

export default confirmGamaTransaction
