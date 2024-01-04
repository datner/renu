import * as Schema from "@effect/schema/Schema";
import * as Management from "@integrations/core/management";
import { ManagementProvider, Order, OrderItem, OrderItemModifier, Prisma } from "database";
import { Modifiers } from "database-helpers";
import { Effect } from "effect";
import { Context, Duration, Option, pipe, ReadonlyArray } from "effect";
import { Order as OrderUtils } from "shared";
import type * as Dorix from "./types";

type OrderItemWithInfo = Prisma.OrderItemGetPayload<{
  include: { item: true; modifiers: { include: { modifier: true } } };
}>;

type FullOrderModifier = Prisma.OrderItemModifierGetPayload<{
  include: { modifier: true };
}>;

export const DorixIntegrations = Schema.struct({
  provider: Schema.literal(ManagementProvider.DORIX),
  vendorData: Schema.struct({
    branchId: Schema.string,
    isQA: Schema.optional(Schema.boolean),
  }),
});

export const Integration = pipe(
  Management.Integration,
  Schema.omit("vendorData"),
  Schema.omit("provider"),
  Schema.extend(DorixIntegrations),
);
export interface Integration extends Schema.Schema.To<typeof Integration> {}

export const IntegrationService = Context.Tag<Integration>();

const ManagementRepresentation = Schema.struct({ id: Schema.optional(pipe(Schema.string, Schema.nullable)) });

export const toModifier = ReadonlyArray.map((m: FullOrderModifier) =>
  pipe(
    m.modifier.config,
    Schema.parseOption(Modifiers.BaseModifier),
    Option.bindTo("config"),
    Option.let("modifierName", ({ config }) =>
      pipe(
        config.content,
        ReadonlyArray.findFirst((c) => c.locale === "he"),
        Option.map((c) => c.name),
        Option.getOrElse(() => config.identifier),
      )),
    Option.bind("choice", ({ config }) => ReadonlyArray.findFirst(config.options, (o) => o.identifier === m.choice)),
    Option.let("id", ({ choice }) =>
      pipe(
        choice.managementRepresentation,
        Schema.parseOption(ManagementRepresentation),
        Option.flatMapNullable((mr) => mr.id),
        Option.getOrElse(() => m.choice),
      )),
    Option.let("name", ({ choice }) =>
      pipe(
        choice.content,
        ReadonlyArray.findFirst((c) => c.locale === "he"),
        Option.map((c) => c.name),
        Option.getOrElse(() => choice.identifier),
      )),
    Option.map(
      ({ id, name, modifierName }): Dorix.Modifier => ({
        id,
        quantity: m.amount,
        price: m.price / 100,
        included: true,
        name,
        modifierText: modifierName,
      }),
    ),
  )
);

export const toItem = ReadonlyArray.map<OrderItemWithInfo[], Dorix.Item>(
  ({ id, itemId, comment, price, orderId, modifiers, ...rest }) => ({
    id: String(itemId),
    notes: comment,
    price: price / 100,
    ...rest,
    modifiers: ReadonlyArray.getSomes(toModifier(modifiers)),
  }),
);

export const getDesiredTime = () =>
  pipe(
    Duration.millis(Date.now()),
    Duration.sum(Duration.minutes(10)),
    Duration.toMillis,
    (d) => new Date(d).toISOString(),
  );

export const toOrder = (order: Management.FullOrderWithItems) =>
  Effect.map(IntegrationService, ({ vendorData: { branchId } }): Dorix.Order => ({
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
  }));

export function toItems(items: (OrderItem & { modifiers: OrderItemModifier[] })[]) {
  return items.map(({ id, itemId, comment, price, orderId, ...rest }) => ({
    id: String(itemId),
    notes: comment,
    price: price / 100,
    ...rest,
    modifiers: [],
  }));
}

export const toTransaction = (order: Order & { items: OrderItem[] }): Dorix.Transaction => ({
  id: order.txId ?? undefined,
  amount: OrderUtils.total(order) / 100,
  type: "CASH",
});

export function toPayment(transaction: Dorix.Transaction): Dorix.Payment {
  return {
    totalAmount: transaction.amount,
    transactions: [transaction],
  };
}

const ORDER_STATUS = {
  awaiting: "AWAITING_TO_BE_RECEIVED",
  received: "RECEIVED",
  preperation: "PREPARATION",
  failed: "FAILED",
  unreachable: "UNREACHABLE",
} as const;

export const OrderStatus = Schema.enums(ORDER_STATUS);

const nullishString = Schema.optional(pipe(Schema.string, Schema.nullable));

export const StatusResponse = Schema.struct({
  branch: Schema.struct({
    id: Schema.string,
    name: nullishString,
  }),
  order: Schema.struct({
    status: OrderStatus,
    id: nullishString,
    externalId: Schema.string,
    source: Schema.literal("RENU"),
    metadata: Schema.optional(Schema.struct({})),
    estimatedTime: Schema.optional(Schema.number),
  }),
  history: Schema.optional(pipe(
    Schema.struct({
      status: OrderStatus,
      timestamp: Schema.string,
    }),
    Schema.array,
  )),
  error: Schema.optional(pipe(
    Schema.struct({
      message: Schema.string,
      stack: Schema.string,
    }),
    Schema.partial,
  )),
});

export const SendOrderResponse = Schema.union(
  Schema.struct({ ack: Schema.literal(true) }),
  Schema.struct({ ack: Schema.literal(false), message: Schema.optional(Schema.string) }),
);
