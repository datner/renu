import { Ctx } from "@blitzjs/next";
import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import { ParseResult, Schema } from "@effect/schema";
import { Prisma } from "database";
import { Cause, Effect, Number, Option, ReadonlyArray } from "effect";
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
        ReadonlyArray.findFirst((o) => o.identifier === om.choice),
        Option.map((opt) => ({
          amount: om.amount,
          price: opt.price,
          choice: om.choice,
          ref: om.modifier.config.identifier,
          modifier: { connect: { id: om.modifier.id } },
        } satisfies Prisma.OrderItemModifierCreateWithoutReferencedInInput)),
        ReadonlyArray.fromOption,
      );

    case "Extras":
      return pipe(
        ReadonlyArray.map(om.choices, ([choice, amount]) =>
          pipe(
            ReadonlyArray.findFirst(om.modifier.config.options, (o) => o.identifier === choice),
            Option.map((o) => (
              {
                amount,
                price: o.price,
                choice,
                ref: om.modifier.config.identifier,
                modifier: { connect: { id: om.modifier.id } },
              } satisfies Prisma.OrderItemModifierCreateWithoutReferencedInInput
            )),
          )),
        ReadonlyArray.getSomes,
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
    create: ReadonlyArray.flatMap(orderItem.modifiers, createNewOrderModifier_),
  },
} satisfies Prisma.OrderItemCreateWithoutOrderInput);

const toOrderInput = (order: SendOrder) => ({
  venue: { connect: { id: order.venueId } },
  state: "Init",
  items: {
    create: ReadonlyArray.map(order.orderItems, toOrderItemInput),
  },
  managementExtra: Schema.encodeSync(Order.Management.ExtraSchema)(order.managementExtra),
  clearingExtra: Schema.encodeSync(Order.Clearing.ExtraSchema)(order.clearingExtra),
  totalCost: Number.sumAll(ReadonlyArray.map(order.orderItems, getItemCost)),
} satisfies Prisma.OrderCreateInput);

const anonymous: <I, A>(
  s: Schema.Schema<I, A>,
) => (input: I, ctx: Ctx) => Effect.Effect<never, ParseResult.ParseError, A> = s => (i, _) => Schema.decode(s)(i);

const createNewOrder = (input: SendOrder) =>
  pipe(
    Effect.sync(() => toOrderInput(input)),
    Effect.flatMap(Order.createDeepOrder),
    Effect.flatMap(Schema.decode(Order.Schema)),
  );

// const matchProvider = Match.discriminator("provider");

const formatter = Intl.NumberFormat("us-IL", { style: "currency", currency: "ILS" });
const notifyAboutNewOrder = (order: SendOrder) =>
  Telegram.notify(`
New Order received for ${order.venueId}!

Customer ordered:
${
    ReadonlyArray.join(
      ReadonlyArray.map(
        order.orderItems,
        (oi) => `${oi.amount} x ${oi.item.identifier} for ${formatter.format(Number.unsafeDivide(oi.cost, 100))}`,
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
