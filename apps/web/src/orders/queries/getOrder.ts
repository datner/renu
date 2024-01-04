import { resolver } from "@blitzjs/rpc";
import * as Schema from "@effect/schema/Schema";
import { Effect, Option as O } from "effect";
import { Order } from "shared";
import { Renu } from "src/core/effect";

const getOrder = resolver.pipe(
  (_, ctx) => ctx.session.orderId,
  O.fromNullable,
  Effect.flatMap(Order.getById),
  Effect.flatMap(Schema.decode(Order.Schema)),
  Renu.runPromise$,
);

export default getOrder;
