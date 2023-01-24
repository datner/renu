import { resolver } from "@blitzjs/rpc"
import * as O from "fp-ts/Option"
import * as C from "fp-ts/Console"
import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import { pipe } from "fp-ts/function"
import { providers, validateTransaction } from "integrations/clearing"
import { Id } from "src/core/helpers/zod"
import { PrismaError } from "src/core/helpers/prisma"
import { z } from "zod"
import { findUniqueOrder, updateOrder } from "../helpers/prisma"
import { gotClient } from "integrations/http/gotHttpClient"
import { breakers } from "integrations/http/circuitBreaker"
import { getOrderStatus, reportOrder } from "integrations/management"
import { fullOrderInclude } from "integrations/clearing/clearingProvider"
import { isTaggedErrorFromUnknown } from "shared/errors"
import { NotFoundError } from "blitz"
import { ManagementUnreachableError } from "src/core/errors"
import * as Z from "@effect/io/Effect"
import * as M from '@integrations/management'
import { inspect, types } from "node:util"
import db, { OrderState, Prisma } from "db"

const ValidateStatus = z.object({
  orderId: z
    .union([Id, z.string().transform(Number)])
    .nullable()
    .refine((id): id is number => id != null),
  txId: z
    .string()
    .nullable()
    .refine((txId): txId is string => txId != null),
})

const fullOrderIncludeWithIntegration = {
  items: {
    include: { item: true, modifiers: { include: { modifier: true } } },
  },
  venue: {
    include: {
      clearingIntegration: true,
      managementIntegration: true,
    },
  },
} satisfies typeof fullOrderInclude & Prisma.OrderInclude

type DeepOrder = Prisma.OrderGetPayload<{ include: typeof fullOrderIncludeWithIntegration }>

const runOperations = (order: DeepOrder) =>  Z.gen(function* ($) {
  const changeState = (state: OrderState) =>  Z.tryCatchPromise(
        () => db.order.update({ where: { id: order.id }, data: { state } }),
        (cause) => new PrismaError("failed to update order state", { cause, resource: "Order" })
      )
  
  const confirmPaidFor = pipe(
  
  )

  return pipe(
    Z.succeed(order),
    Z.
  )

}){
  {
    const changeState = (state: OrderState) =>
      Z.tryCatchPromise(
        () => db.order.update({ where: { id: order.id }, data: { state } }),
        (cause) => new PrismaError("failed to update order state", { cause, resource: "Order" })
      )

    const confirmPaidFor = pipe(
      validateTransaction(order),
      RTE.chainTaskEitherKW((txId) =>
        updateOrder({ where: { id: order.id }, data: { state: OrderState.PaidFor, txId } })
      )
    )
    const confirmReported = pipe(
      reportOrder(order),
      RTE.chainTaskEitherKW(() => changeState(OrderState.Unconfirmed))
    )
    const confirmOrder = pipe(getOrderStatus(order), RTE.chainTaskEitherKW(changeState))
    console.log(inspect(order, { colors: true, depth: 1 }))

    switch (order.state) {
      case "Init":
        return pipe(
          RTE.of(order),
          RTE.chainFirstW(() => confirmPaidFor),
          RTE.chainFirstW(() => confirmReported),
          RTE.chainFirstW(() => confirmOrder)
        )

      case "PaidFor":
        return pipe(RTE.of(order), RTE.apFirstW(confirmReported), RTE.apFirstW(confirmOrder))

      case "Unconfirmed":
        return pipe(RTE.of(order), RTE.apFirstW(confirmOrder))

      default:
        return RTE.of(order)
    }
  }
}

export default resolver.pipe(resolver.zod(ValidateStatus), (input) =>
  Z.unsafeRunPromiseEither(
    pipe(
      Z.tryCatchPromise(
        () =>
          db.order.findUniqueOrThrow({
            where: { id: input.orderId },
            include: fullOrderIncludeWithIntegration,
          }),
        (cause) => new PrismaError("Could not find order", { cause, resource: "Order" })
      ),
      Z.flatMap((order) => (order.state === OrderState.Confirmed ? Z.succeed(order) : Z.never())),
      TE.chainW(
        TE.fromPredicate(
          (o) => o.state === OrderState.Confirmed,
          (order) => ({ _tag: "Validate", order } as const)
        )
      ),
      TE.orElseFirstW((e) => {
        if (e._tag === "PrismaError") return TE.left(e)
        return pipe(
          TE.Do,
          TE.let("order", () => e.order),
          TE.bindW("managementIntegration", ({ order }) =>
            TE.fromNullable({ tag: "NoManagementIntegration" } as const)(
              order.venue.managementIntegration
            )
          ),
          TE.bindW("clearingIntegration", ({ order }) =>
            TE.fromNullable({ tag: "NoClearingIntegration" } as const)(
              order.venue.clearingIntegration
            )
          ),
          TE.chainW(({ order, clearingIntegration, managementIntegration }) =>
            runOperations(order)({
              circuitBreakerOptions: breakers[managementIntegration.provider],
              managementIntegration,
              clearingIntegration,
              clearingProvider: providers[clearingIntegration.provider],
              httpClient: gotClient,
            })
          )
        )
      }),
      TE.orLeft((e) => {
        if ("_tag" in e) {
          if (e._tag === "ManagementError") {
            if (isTaggedErrorFromUnknown("HttpNotFoundError")(e.error))
              if (types.isNativeError(e.error.error)) {
                throw new NotFoundError(e.error.error.message)
              }
            if (isTaggedErrorFromUnknown("BreakerError")(e.error)) {
              throw new ManagementUnreachableError()
            }
            throw new NotFoundError("Order not found")
          }
        }
        throw e
      })
    )
  )
)
