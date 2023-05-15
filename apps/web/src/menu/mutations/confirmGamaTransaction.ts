import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Gama } from "@integrations/gama";
import { Presto } from "@integrations/presto";
import * as Message from "integrations/telegram/sendMessage";
import { Order } from "shared";
import { Renu } from "src/core/effect";

const ConfirmGamaTransaction = Schema.struct({
  jwt: Schema.string,
});

const confirmGamaTransaction = resolver.pipe(
  (i: Schema.From<typeof ConfirmGamaTransaction>) => Schema.decodeEffect(ConfirmGamaTransaction)(i),
  Effect.zip(Gama),
  Effect.flatMap(([{ jwt }, gama]) => gama.attachTxId(jwt)),
  Effect.tap((id) => Order.setOrderState(id, "PaidFor")),
  Effect.zip(Presto),
  (self, ctx) =>
    Effect.flatMap(self, ([id, presto]) =>
      pipe(
        presto.postOrder(id),
        Effect.tap(() => Order.setOrderState(id, "Confirmed")),
        Effect.tap(() => Effect.promise(() => ctx.session.$setPublicData({ orderId: id }))),
      )),
  Effect.tap(Message.sendJson),
  Renu.runPromise$,
);

export default confirmGamaTransaction;
