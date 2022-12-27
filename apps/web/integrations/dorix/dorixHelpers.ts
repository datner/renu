import { Order, OrderItem, OrderItemModifier, Prisma } from "@prisma/client"
import { addMinutes, formatISO } from "date-fns/fp"
import { now } from "fp-ts/Date"
import * as A from "fp-ts/Array"
import * as O from "fp-ts/Option"
import * as E from "fp-ts/Either"
import { flow, pipe } from "fp-ts/function"
import { OrderUtils } from "src/orders/utils"
import { z } from "zod"
import * as Dorix from "./types"
import {
  ManagementMenu,
  ManagementCategory,
  ManagementItem,
  ManagementModifier,
  ManagementModifierOption,
} from "integrations/management/types"
import { FullOrderWithItems } from "integrations/clearing/clearingProvider"
import { ensureType } from "src/core/helpers/zod"
import { BaseModifier } from "db/itemModifierConfig"
import { host } from "src/core/helpers/env"

type OrderItemWithInfo = Prisma.OrderItemGetPayload<{
  include: { item: true; modifiers: { include: { modifier: true } } }
}>

type FullOrderModifier = Prisma.OrderItemModifierGetPayload<{
  include: { modifier: true }
}>

const ManagementRepresentation = z.object({ id: z.string().nullish() }).partial()

export const toModifier = A.map((m: FullOrderModifier) =>
  pipe(
    m.modifier.config,
    ensureType(BaseModifier),
    E.bindTo("config"),
    E.let("modifierName", ({ config }) =>
      pipe(
        config.content,
        A.findFirst((c) => c.locale === "he"),
        O.map((c) => c.name),
        O.getOrElse(() => config.identifier)
      )
    ),
    E.bindW("choice", ({ config }) =>
      pipe(
        config.options,
        A.findFirst((o) => o.identifier === m.choice),
        E.fromOption(() => ({ tag: "OptionNotFound", choice: m.choice }))
      )
    ),
    E.let("id", ({ choice }) =>
      pipe(
        ensureType(ManagementRepresentation)(choice.managementRepresentation),
        O.fromEither,
        O.chainNullableK((mr) => mr.id),
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

export const toOrder =
  (order: FullOrderWithItems) =>
  (branchId: string): Dorix.Order => ({
    externalId: String(order.id),
    payment: pipe(order, toTransaction, toPayment),
    items: toItems(order.items),
    source: "RENU",
    branchId,
    notes: "Sent from Renu",
    desiredTime: getDesiredTime(),
    type: Dorix.DELIVERY_TYPES.PICKUP,
    customer: { firstName: "", lastName: "", email: "", phone: "" },
    discounts: [],
    metadata: {},
    webhooks: {
      status: `${host()}/api/webhooks/dorix/status`,
    },
  })

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
  type: Dorix.PAYMENT_TYPES.CASH,
})

export function toPayment(transaction: Dorix.Transaction): Dorix.Payment {
  return {
    totalAmount: transaction.amount,
    transactions: [transaction],
  }
}

export const getDesiredTime = flow(now, addMinutes(10), formatISO)

export const OrderStatus = z.enum([
  "AWAITING_TO_BE_RECEIVED",
  "RECEIVED",
  "PREPARATION",
  "FAILED",
  "UNREACHABLE",
])

export const StatusResponse = z.object({
  branch: z.object({
    id: z.string(),
    name: z.string().nullish(),
  }),
  order: z.object({
    status: OrderStatus,
    id: z.string().nullish(),
    externalId: z.string(),
    source: z.literal("RENU"),
    metadata: z.object({}).optional(),
    estimatedTime: z.number().optional(),
  }),
  history: z
    .object({
      status: OrderStatus,
      timestamp: z.string(),
    })
    .array(),
  error: z
    .object({
      message: z.string(),
      stack: z.string(),
    })
    .partial()
    .optional(),
})

const MangledNumberish = z.union([z.string(), z.number()]).transform(Number)

const DorixPrice = z.object({
  inplace: MangledNumberish,
  ta: MangledNumberish,
  delivery: MangledNumberish,
  pickup: MangledNumberish,
})

const DorixAnswer = z.object({
  id: z.string(),
  name: z.string(),
  price: z
    .object({
      inplace: MangledNumberish,
      ta: MangledNumberish,
      delivery: MangledNumberish,
      pickup: MangledNumberish,
    })
    .partial()
    .optional(),
})

const DorixQuestion = z.object({
  name: z.string(),
  mandatory: z.boolean(),
  answerLimit: z.string().transform(Number).optional(),
  items: z.array(DorixAnswer),
})

export const DorixItem = z.object({
  _id: z.string(),
  price: DorixPrice.partial().optional(),
  name: z.string(),
  description: z.string().default(""),
  questions: z
    .object({
      mandatory: z.array(DorixQuestion.extend({ mandatory: z.literal(true) })),
      optional: z.array(DorixQuestion.extend({ mandatory: z.literal(false) })),
    })
    .optional(),
})

type DorixItem = z.infer<typeof DorixItem>

type DorixItemWithQuestions = Omit<Required<DorixItem>, "price"> & Pick<DorixItem, "price">

export const DorixCategory = z.object({
  _id: z.string(),
  name: z.string(),
  items: z.array(DorixItem),
})

export const DorixMenu = z
  .object({
    _id: z.string(),
    name: z.string(),
    items: z.array(DorixCategory),
  })
  .transform(
    (dorix): ManagementMenu => ({
      id: dorix._id,
      name: dorix.name,
      categories: pipe(
        dorix.items,
        A.map(
          (c): ManagementCategory => ({
            id: c._id,
            name: c.name,
            items: pipe(
              c.items,
              A.filter(
                (i): i is DorixItemWithQuestions =>
                  Array.isArray(i.questions?.optional) || Array.isArray(i.questions?.mandatory)
              ),
              A.map(
                (i): ManagementItem => ({
                  id: i._id,
                  name: i.name,
                  description: i.description,
                  price: Number(i.price?.inplace ?? 0),
                  modifiers: pipe(
                    i.questions.mandatory,
                    A.concatW(i.questions.optional),
                    A.map(
                      (m): ManagementModifier => ({
                        name: m.name,
                        max: m.answerLimit,
                        min: m.mandatory ? 1 : undefined,
                        options: pipe(
                          m.items,
                          A.map(
                            (o): ManagementModifierOption => ({
                              id: o.id,
                              name: o.name,
                              price: o.price?.inplace,
                            })
                          )
                        ),
                      })
                    )
                  ),
                })
              )
            ),
          })
        )
      ),
    })
  )

export const OrderResponse = z.discriminatedUnion("ack", [
  z.object({ ack: z.literal(true) }),
  z.object({ ack: z.literal(false), message: z.string() }),
])

export const MenuResponse = z.discriminatedUnion("ack", [
  z.object({ ack: z.literal(true), data: z.object({ menu: DorixMenu }) }),
  z.object({ ack: z.literal(false), message: z.string().optional() }),
])
