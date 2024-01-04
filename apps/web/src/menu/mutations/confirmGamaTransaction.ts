import { resolver } from "@blitzjs/rpc";
import * as Schema from "@effect/schema/Schema";
import { Gama } from "@integrations/gama";
import { Presto } from "@integrations/presto";
import { Effect } from "effect";
import * as Message from "integrations/telegram/sendMessage";
import { Order } from "shared";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";

const ConfirmGamaTransaction = Schema.struct({
  jwt: Schema.string,
});

const confirmGamaTransaction = resolver.pipe(
  Resolver.schema(ConfirmGamaTransaction),
  Effect.zip(Gama),
  Effect.flatMap(([{ jwt }, gama]) => gama.attachTxId(jwt)),
  Effect.tap((id) => Order.setOrderState(id, "PaidFor")),
  Effect.zip(Presto),
  Resolver.flatMap(([id, presto], ctx) =>
    presto.postOrder(id).pipe(
      Effect.tap(() => Order.setOrderState(id, "Confirmed")),
      Effect.tap(() => Effect.promise(() => ctx.session.$setPublicData({ orderId: id }))),
    )
  ),
  Effect.tap(Message.sendJson),
  Renu.runPromise$,
);

export default confirmGamaTransaction;
