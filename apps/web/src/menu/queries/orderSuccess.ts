import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import db from "db";
import * as Effect from "effect/Effect";
import { prismaError } from "src/core/helpers/prisma";
import { Id } from "src/core/helpers/zod";
import { z } from "zod";

const OrderSuccess = z.object({
  orderId: z
    .union([Id, z.string().transform(Number)])
    .nullable()
    .refine((id): id is number => id != null),
});
type OrderSuccess = z.infer<typeof OrderSuccess>;

class NoTxIdError {
  readonly _tag = "NoTxIdError";
}

class StateNotConfirmedError {
  readonly _tag = "StateNotConfirmedError";
}

export default resolver.pipe(resolver.zod(OrderSuccess), (input: OrderSuccess) =>
  pipe(
    Effect.tryPromise({
      try: () => db.order.findUniqueOrThrow({ where: { id: input.orderId } }),
      catch: prismaError("Order"),
    }),
    Effect.filterOrFail(
      (o) => o.txId != null,
      () => new NoTxIdError(),
    ),
    Effect.filterOrFail(
      (o) => o.state === "Confirmed",
      () => new StateNotConfirmedError(),
    ),
    Effect.runPromise,
  ));
