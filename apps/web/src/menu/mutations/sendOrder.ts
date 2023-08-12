import { Ctx } from "@blitzjs/next";
import { resolver } from "@blitzjs/rpc";
import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as N from "@effect/data/Number";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Cause from "@effect/io/Cause";
import * as Effect from "@effect/io/Effect";
import { ParseError } from "@effect/schema/ParseResult";
import * as S from "@effect/schema/Schema";
import { Prisma } from "database";
import * as Telegram from "integrations/telegram/sendMessage";
import { Order } from "shared";
import * as Renu from "src/core/effect/runtime";
import * as _Item from "src/core/prisma/item";
import { getItemCost, SendOrder, SendOrderItem, SendOrderModifiers } from "src/menu/validations/order";
import { Format } from "telegraf";
import { inspect } from "util";
import * as _Menu from "../schema";

const createNewOrderModifier_ = (om: SendOrderModifiers) => {
  switch (om._tag) {
    case "OneOf":
      return pipe(
        om.modifier.config.options,
        A.findFirst((o) => o.identifier === om.choice),
        O.map((opt) => ({
          amount: om.amount,
          price: opt.price,
          choice: om.choice,
          ref: om.modifier.config.identifier,
          modifier: { connect: { id: om.modifier.id } },
        } satisfies Prisma.OrderItemModifierCreateWithoutReferencedInInput)),
        A.fromOption,
      );

    case "Extras":
      return pipe(
        A.map(om.choices, ([choice, amount]) =>
          pipe(
            A.findFirst(om.modifier.config.options, (o) => o.identifier === choice),
            O.map((o) => (
              {
                amount,
                price: o.price,
                choice,
                ref: om.modifier.config.identifier,
                modifier: { connect: { id: om.modifier.id } },
              } satisfies Prisma.OrderItemModifierCreateWithoutReferencedInInput
            )),
          )),
        A.compact,
      );
  }
};

const toOrderItemInput = (orderItem: SendOrderItem) => ({
  item: { connect: { id: orderItem.item.id } },
  price: orderItem.item.price,
  comment: orderItem.comment ?? "",
  name: orderItem.item.identifier,
  quantity: orderItem.amount,
  modifiers: {
    create: A.flatMap(orderItem.modifiers, createNewOrderModifier_),
  },
} satisfies Prisma.OrderItemCreateWithoutOrderInput);

const toOrderInput = (order: SendOrder) => ({
  venue: { connect: { id: order.venueId } },
  state: "Init",
  items: {
    create: A.map(order.orderItems, toOrderItemInput),
  },
  managementExtra: S.encodeSync(Order.Management.ExtraSchema)(order.managementExtra),
  clearingExtra: S.encodeSync(Order.Clearing.ExtraSchema)(order.clearingExtra),
  totalCost: N.sumAll(A.map(order.orderItems, getItemCost)),
} satisfies Prisma.OrderCreateInput);

const anonymous: <I, A>(
  s: S.Schema<I, A>,
) => (input: I, ctx: Ctx) => Effect.Effect<never, ParseError, A> = s => (i, _) => S.decode(s)(i);

const createNewOrder = (input: SendOrder) =>
  pipe(
    Effect.sync(() => toOrderInput(input)),
    Effect.flatMap(Order.createDeepOrder),
    Effect.flatMap(S.decode(Order.Schema)),
  );

// const matchProvider = Match.discriminator("provider");

const notifyAboutNewOrder = (order: SendOrder) =>
  Telegram.notify(`
New Order received for ${order.venueId}!

Customer ordered:
${
    A.join(
      A.map(
        order.orderItems,
        (oi) =>
          `${oi.amount} x ${oi.item.identifier} for ${
            N.divide(oi.cost, 100).toLocaleString("us-IL", {
              style: "currency",
              currency: "ILS",
            })
          }`,
      ),
      `\n`,
    )
  }
`);

const notifyDatnerAboutError = <E>(cause: Cause.Cause<E>) =>
  Telegram.alertDatner(`
Send Order Failed!

pretty cause:
${Format.pre("logs")(Cause.pretty(cause))}

`);

export default resolver.pipe(
  anonymous(SendOrder),
  Effect.tap(notifyAboutNewOrder),
  // TODO: support updating the order instead
  // TODO: or instead just destroy the previous order.
  Effect.flatMap(createNewOrder),
  Effect.tap(o => Effect.sync(() => console.log(inspect(o, false, null, true)))),
  Effect.tapErrorCause(notifyDatnerAboutError),
  Renu.runPromise$,
);
