import { resolver } from "@blitzjs/rpc";
import * as O from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Order } from "shared";
import { Renu } from "src/core/effect";

const getOrder = resolver.pipe(
  (_, ctx) => ctx.session.orderId,
  O.fromNullable,
  Effect.flatMap(Order.getById),
  Effect.flatMap(Schema.decodeEffect(Order.Schema)),
  Renu.runPromise$,
);

export default getOrder;
