import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Gama } from "@integrations/gama";
import { Presto } from "@integrations/presto";
import * as Message from "integrations/telegram/sendMessage";
import { Renu } from "src/core/effect";

const ConfirmGamaTransaction = Schema.struct({
  jwt: Schema.string,
});

const confirmGamaTransaction = resolver.pipe(
  (i: Schema.From<typeof ConfirmGamaTransaction>) => Schema.decodeEffect(ConfirmGamaTransaction)(i),
  Effect.zip(Gama),
  Effect.flatMap(([{ jwt }, gama]) => gama.attachTxId(jwt)),
  Effect.zip(Presto),
  Effect.flatMap(([id, presto]) => presto.postOrder(id)),
  Effect.tap(Message.sendJson),
  Renu.runPromise$,
);

export default confirmGamaTransaction;
