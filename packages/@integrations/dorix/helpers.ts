import * as Effect from "@effect/io/Effect"
import * as Context from "@fp-ts/data/Context"
import * as T from "@fp-ts/data/These"
import * as O from "@fp-ts/data/Option"
import * as E from "@fp-ts/data/Either"
import * as A from "@fp-ts/data/ReadonlyArray"
import * as Duration from "@fp-ts/data/Duration"
import * as C from "@fp-ts/schema/Codec"
import * as D from "@fp-ts/schema/Decoder"
import * as S from "@fp-ts/schema/Schema"
import { pipe } from "@fp-ts/data/Function"
import * as Management from "@integrations/core/management"
import { ManagementProvider, Order, OrderItem, OrderItemModifier, Prisma } from "database"
import { Modifiers } from "database-helpers"
import { Order as OrderUtils } from "shared"
import type * as Dorix from "./types"

type OrderItemWithInfo = Prisma.OrderItemGetPayload<{
  include: { item: true; modifiers: { include: { modifier: true } } }
}>

type FullOrderModifier = Prisma.OrderItemModifierGetPayload<{
  include: { modifier: true }
}>

export const DorixIntegrations = C.struct({
  provider: C.literal(ManagementProvider.DORIX),
  vendorData: C.struct({
    branchId: C.string,
    isQA: C.optional(C.boolean),
  }),
})

export const Integration = pipe(
  Management.Integration,
  C.omit("vendorData"),
  C.extend(DorixIntegrations)
)
export type Integration = C.Infer<typeof Integration>

export const IntegrationService = Context.Tag<Integration>()

const ManagementRepresentation = pipe(
  C.struct({ id: pipe(C.string, C.nullable, C.optional) }),
  C.partial
)

export const toModifier = A.map((m: FullOrderModifier) =>
  pipe(
    Modifiers.BaseModifier.decode(m.modifier.config),
    T.toEither((_, a) => E.right(a)),
    E.bindTo("config"),
    E.let("modifierName", ({ config }) =>
      pipe(
        config.content,
        A.findFirst((c) => c.locale === "he"),
        O.map((c) => c.name),
        O.getOrElse(() => config.identifier)
      )
    ),
    E.bind("choice", ({ config }) =>
      pipe(
        config.options,
        A.findFirst((o) => o.identifier === m.choice),
        E.fromOption(() => ({ tag: "OptionNotFound", choice: m.choice }))
      )
    ),
    E.let("id", ({ choice }) =>
      pipe(
        ManagementRepresentation.decode(choice.managementRepresentation),
        T.toEither((_, a) => E.right(a)),
        O.fromEither,
        O.flatMapNullable((mr) => mr.id),
        O.getOrElse(() => m.choice)
      )
    ),
    E.let("name", ({ choice }) =>
      pipe(
        choice.content,
        A.findFirst((c) => c.locale === "he"),
        O.map((c) => c.name),
        O.getOrElse(() => choice.identifier)
      )
    ),
    E.map(
      ({ id, name, modifierName }): Dorix.Modifier => ({
        id,
        quantity: m.amount,
        price: m.price / 100,
        included: true,
        name,
        modifierText: modifierName,
      })
    )
  )
)

export const toItem = A.map<OrderItemWithInfo, Dorix.Item>(
  ({ id, itemId, comment, price, orderId, modifiers, ...rest }) => ({
    id: String(itemId),
    notes: comment,
    price: price / 100,
    ...rest,
    modifiers: A.rights(toModifier(modifiers)),
  })
)

export const getDesiredTime = () =>
  pipe(Duration.millis(Date.now()), Duration.add(Duration.minutes(10)), (d) =>
    new Date(d.millis).toISOString()
  )

export const toOrder = (order: Management.FullOrderWithItems) =>
  pipe(
    Effect.service(IntegrationService),
    Effect.map(
      ({ vendorData: { branchId } }): Dorix.Order => ({
        externalId: String(order.id),
        payment: pipe(order, toTransaction, toPayment),
        items: toItems(order.items),
        source: "RENU",
        branchId,
        notes: "Sent from Renu",
        desiredTime: getDesiredTime(),
        type: "PICKUP",
        customer: { firstName: "", lastName: "", email: "", phone: "" },
        discounts: [],
        metadata: {},
        webhooks: {
          status: `https://renu.menu/api/webhooks/dorix/status`,
        },
      })
    )
  )

export function toItems(items: (OrderItem & { modifiers: OrderItemModifier[] })[]) {
  return items.map(({ id, itemId, comment, price, orderId, ...rest }) => ({
    id: String(itemId),
    notes: comment,
    price: price / 100,
    ...rest,
    modifiers: [],
  }))
}

export const toTransaction = (order: Order & { items: OrderItem[] }): Dorix.Transaction => ({
  id: order.txId ?? undefined,
  amount: OrderUtils.total(order) / 100,
  type: "CASH",
})

export function toPayment(transaction: Dorix.Transaction): Dorix.Payment {
  return {
    totalAmount: transaction.amount,
    transactions: [transaction],
  }
}

const ORDER_STATUS = {
  awaiting: "AWAITING_TO_BE_RECEIVED",
  received: "RECEIVED",
  preperation: "PREPARATION",
  failed: "FAILED",
  unreachable: "UNREACHABLE",
} as const

export const OrderStatus = C.enums(ORDER_STATUS)

const nullishString = pipe(C.string, C.nullable, C.optional)

export const StatusResponse = C.struct({
  branch: C.struct({
    id: C.string,
    name: nullishString,
  }),
  order: C.struct({
    status: OrderStatus,
    id: nullishString,
    externalId: C.string,
    source: C.literal("RENU"),
    metadata: pipe(C.struct({}), C.optional),
    estimatedTime: pipe(C.number, C.optional),
  }),
  history: pipe(
    C.struct({
      status: OrderStatus,
      timestamp: C.string,
    }),
    C.array,
    C.optional
  ),
  error: pipe(
    C.struct({
      message: C.string,
      stack: C.string,
    }),
    C.partial,
    C.optional
  ),
})

export const SendOrderResponse = S.union(
  S.struct({ ack: S.literal(true) }),
  S.struct({ ack: S.literal(false), message: pipe(S.string, S.optional) })
)

export const SendOrderResponseDecoder = D.decoderFor(SendOrderResponse)
