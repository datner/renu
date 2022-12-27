import { resolver } from "@blitzjs/rpc"
import { OrderState, Prisma } from "@prisma/client"
import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import { pipe } from "fp-ts/function"
import { providers, validateTransaction } from "integrations/clearing"
import { Id } from "src/core/helpers/zod"
import { z } from "zod"
import { findUniqueOrder, updateOrder } from "../helpers/prisma"
import { gotClient } from "integrations/http/gotHttpClient"
import { breakers } from "integrations/http/circuitBreaker"
import { clients, getOrderStatus, reportOrder } from "integrations/management"
import { fullOrderInclude } from "integrations/clearing/clearingProvider"

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

const runOperations = (order: DeepOrder) => {
  {
    const changeState = (state: OrderState) =>
      updateOrder({ where: { id: order.id }, data: { state } })

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

    switch (order.state) {
      case "Init":
        return pipe(
          RTE.of(order),
          RTE.apFirstW(confirmPaidFor),
          RTE.apFirstW(confirmReported),
          RTE.apFirstW(confirmOrder)
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
  pipe(
    findUniqueOrder({
      where: { id: input.orderId },
      include: fullOrderIncludeWithIntegration,
    }),
    TE.chainW(
      TE.fromPredicate(
        (o) => o.state === OrderState.Confirmed,
        (order) => ({ tag: "Validate", order } as const)
      )
    ),
    TE.orElseFirstW((e) => {
      if (e.tag === "PrismaError") return TE.left(e)
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
            managementClient: clients[managementIntegration.provider],
            managementIntegration,
            clearingIntegration,
            clearingProvider: providers[clearingIntegration.provider],
            httpClient: gotClient,
          })
        )
      )
    }),
    TE.orLeft((e) => {
      throw e
    })
  )()
)
