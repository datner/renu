import * as Context from "@effect/data/Context";
import * as Duration from "@effect/data/Duration";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as P from "@effect/schema/Parser";
import * as S from "@effect/schema/Schema";
import * as Management from "@integrations/core/management";
import { ManagementProvider, Order, OrderItem, OrderItemModifier, Prisma } from "database";
import { Modifiers } from "database-helpers";
import { Order as OrderUtils } from "shared";
import type * as Dorix from "./types";

type OrderItemWithInfo = Prisma.OrderItemGetPayload<{
  include: { item: true; modifiers: { include: { modifier: true } } };
}>;

type FullOrderModifier = Prisma.OrderItemModifierGetPayload<{
  include: { modifier: true };
}>;

export const DorixIntegrations = S.struct({
  provider: S.literal(ManagementProvider.DORIX),
  vendorData: S.struct({
    branchId: S.string,
    isQA: S.optional(S.boolean),
  }),
});

export const Integration = pipe(
  Management.Integration,
  S.omit("vendorData"),
  S.omit("provider"),
  S.extend(DorixIntegrations),
);
export interface Integration extends S.To<typeof Integration> {}

export const IntegrationService = Context.Tag<Integration>();

const ManagementRepresentation = S.struct({ id: S.optional(pipe(S.string, S.nullable)) });

export const toModifier = A.map((m: FullOrderModifier) =>
  pipe(
    m.modifier.config,
    S.parseOption(Modifiers.BaseModifier),
    O.bindTo("config"),
    O.let("modifierName", ({ config }) =>
      pipe(
        config.content,
        A.findFirst((c) => c.locale === "he"),
        O.map((c) => c.name),
        O.getOrElse(() => config.identifier),
      )),
    O.bind("choice", ({ config }) => A.findFirst(config.options, (o) => o.identifier === m.choice)),
    O.let("id", ({ choice }) =>
      pipe(
        choice.managementRepresentation,
        P.parseOption(ManagementRepresentation),
        O.flatMapNullable((mr) => mr.id),
        O.getOrElse(() => m.choice),
      )),
    O.let("name", ({ choice }) =>
      pipe(
        choice.content,
        A.findFirst((c) => c.locale === "he"),
        O.map((c) => c.name),
        O.getOrElse(() => choice.identifier),
      )),
    O.map(
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

export const toItem = A.map<OrderItemWithInfo, Dorix.Item>(
  ({ id, itemId, comment, price, orderId, modifiers, ...rest }) => ({
    id: String(itemId),
    notes: comment,
    price: price / 100,
    ...rest,
    modifiers: A.compact(toModifier(modifiers)),
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

export const OrderStatus = S.enums(ORDER_STATUS);

const nullishString = S.optional(pipe(S.string, S.nullable));

export const StatusResponse = S.struct({
  branch: S.struct({
    id: S.string,
    name: nullishString,
  }),
  order: S.struct({
    status: OrderStatus,
    id: nullishString,
    externalId: S.string,
    source: S.literal("RENU"),
    metadata: S.optional(S.struct({})),
    estimatedTime: S.optional(S.number),
  }),
  history: S.optional(pipe(
    S.struct({
      status: OrderStatus,
      timestamp: S.string,
    }),
    S.array,
  )),
  error: S.optional(pipe(
    S.struct({
      message: S.string,
      stack: S.string,
    }),
    S.partial,
  )),
});

export const SendOrderResponse = S.union(
  S.struct({ ack: S.literal(true) }),
  S.struct({ ack: S.literal(false), message: S.optional(S.string) }),
);
