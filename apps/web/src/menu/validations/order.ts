import * as S from "@effect/schema/Schema";
import { PAYMENT_TYPES } from "@integrations/dorix/types";
import { Locale } from "database";
import { Equal, Number as N, Option as O, pipe, ReadonlyArray as A } from "effect";
import { Item, Order, Venue } from "shared";
import { Common, Number } from "shared/schema";

export const SendOrderOneOf = S.struct({
  _tag: S.literal("OneOf"),
  modifier: pipe(
    Item.modifierFromId,
    S.filter(Item.Modifier.isOneOf),
  ),
  choice: Common.Slug,
  // TODO: right now, one-of can't be multiple. Probably shouldn't ever be
  amount: pipe(Number.Amount, S.lessThan(2)),
});
export interface SendOrderOneOf extends S.Schema.To<typeof SendOrderOneOf> {}

const getMin = O.getOrElse(() => 0);
const getMax = O.getOrElse(() => Infinity);

export const SendOrderExtras = pipe(
  S.struct({
    _tag: S.literal("Extras"),
    modifier: pipe(
      Item.modifierFromId,
      S.filter(Item.Modifier.isExtras),
    ),
    choices: S.array(S.tuple(Common.Slug, Number.Amount)),
  }),
  S.filter(({ modifier, choices }) =>
    pipe(
      choices.every(([choice]) => modifier.config.options.some(o => o.identifier === choice)),
    ), {
    message: (m) =>
      `Item Modifier ${m.modifier.config.identifier} did not have all if the requested options. Expected ${
        m.choices.map(([c]) => c)
      }`,
  }),
  S.filter(({ modifier, choices }) =>
    pipe(
      choices.every(([choice, amount]) =>
        pipe(
          A.findFirst(modifier.config.options, o => o.identifier === choice),
          O.filter(o => amount === 1 || o.multi),
          O.isSome,
        )
      ),
    ), {
    message: (m) =>
      `Item Modifier ${m.modifier.config.identifier} sent with a choice with a greater amount than allowed`,
  }),
  S.filter(({ modifier, choices }) =>
    pipe(
      A.map(choices, ([_, amount]) => amount),
      N.sumAll,
      N.between({
        minimum: getMin(modifier.config.min),
        maximum: getMax(modifier.config.max),
      }),
    ), {
    message: (m) =>
      `Item Modifier ${m.modifier.config.identifier} sent with a modifier amount outside of range.
      Expected: { ${getMin(m.modifier.config.min)} ... ${getMax(m.modifier.config.max)} }
      Recieved: ${N.sumAll(A.map(m.choices, ([_, amount]) => amount))}
`,
  }),
);
export interface SendOrderExtras extends S.Schema.To<typeof SendOrderExtras> {}

export const SendOrderModifiers = S.union(SendOrderOneOf, SendOrderExtras);
export type SendOrderModifiers = SendOrderOneOf | SendOrderExtras;

export const getModCost = (mod: SendOrderModifiers) => {
  switch (mod._tag) {
    case "OneOf":
      return pipe(
        A.findFirst(mod.modifier.config.options, o => o.identifier === mod.choice),
        O.map(o => o.price),
        O.map(N.multiply(mod.amount)),
        O.getOrElse(() => 0),
      );

    case "Extras":
      return pipe(
        A.map(mod.choices, ([choice, amount]) =>
          pipe(
            A.findFirst(mod.modifier.config.options, o => o.identifier === choice),
            O.map(o => o.price),
            O.map(N.multiply(amount)),
          )),
        O.reduceCompact(0, N.sum),
      );
  }
};

export const getItemCost = ({ modifiers, item, amount }: SendOrderItem) =>
  pipe(
    A.map(modifiers, getModCost),
    A.append(item.price),
    N.sumAll,
    N.multiply(amount),
  );

const _SendOrderItem = S.struct({
  item: Item.fromId,
  amount: Number.Amount,
  cost: Number.Cost,
  comment: S.optional(pipe(S.string, S.maxLength(250))),
  modifiers: S.array(SendOrderModifiers),
});

export const SendOrderItem = pipe(
  _SendOrderItem,
  S.filter((oi) => getItemCost(oi) === oi.cost, {
    message: (i) => `Item ${i.item} reported cost (${i.cost}) did not match expected`,
  }),
);
export interface SendOrderItem extends S.Schema.To<typeof _SendOrderItem> {}

export const Transaction = S.struct({
  id: S.string,
  amount: S.number,
  type: S.enums(PAYMENT_TYPES),
});

export const UpdateManagement = S.struct({
  id: pipe(S.number, S.int(), S.greaterThan(0)),
  venueIdentifier: Common.Slug,
  phone: S.string,
  transaction: Transaction,
});

export const SendOrder = pipe(
  S.struct({
    locale: S.enums(Locale),
    clearingExtra: Order.Clearing.ExtraSchema,
    managementExtra: Order.Management.ExtraSchema,
    venueId: Venue.Id,
    orderItems: S.array(SendOrderItem),
  }),
  S.filter((order) =>
    order.orderItems.every(({ item }) =>
      pipe(
        item.venueId,
        O.filter(Equal.equals(order.venueId)),
        O.isSome,
      )
    )
  ),
);

export interface SendOrder extends S.Schema.To<typeof SendOrder> {}
export interface EncodedSendOrder extends S.Schema.From<typeof SendOrder> {}
