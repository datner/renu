import { resolver } from "@blitzjs/rpc";
import { Effect } from "effect";
import { Order } from "shared";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";

const getOrderStatus = resolver.pipe(
  Resolver.schema(Order.Id),
  Effect.flatMap(Order.getById),
  Effect.map(_ => _.state),
  Renu.runPromise$,
);

export default getOrderStatus;
