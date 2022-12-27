import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { pipe } from "fp-ts/function"
import { Order } from "@prisma/client"
import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import { Id } from "src/core/helpers/zod"
import { findUniqueOrder } from "src/orders/helpers/prisma"

const OrderSuccess = z.object({
  orderId: z
    .union([Id, z.string().transform(Number)])
    .nullable()
    .refine((id): id is number => id != null),
})
type OrderSuccess = z.infer<typeof OrderSuccess>

const ensureOrderState = <O extends Order>(order: O) =>
  pipe(
    order,
    E.fromPredicate(
      (o: Order) => o.state === "Confirmed",
      () => ({ tag: "StateNotConfirmedError", order } as const)
    )
  )

const ensureOrderTxId = <O extends Order>(order: O) =>
  pipe(
    order,
    E.fromPredicate(
      (o: Order) => o.txId != null,
      () => ({ tag: "NoTxId", order } as const)
    )
  )

const orderSuccess = (input: OrderSuccess) =>
  pipe(
    findUniqueOrder({ where: { id: input.orderId } }),
    TE.chainEitherKW(ensureOrderTxId),
    TE.chainEitherKW(ensureOrderState)
  )

export default resolver.pipe(resolver.zod(OrderSuccess), orderSuccess, (task) => task())
