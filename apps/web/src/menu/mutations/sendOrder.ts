import { resolver } from "@blitzjs/rpc";
import db from "db";
import {
  Item as PItem,
  ItemI18L,
  ItemModifier,
  Locale,
  OrderState,
  Prisma,
} from "database";
import {
  EncodedSendOrder,
  SendOrder,
  SendOrderItem,
  SendOrderModifiers,
} from "src/menu/validations/order";
import { absurd, pipe, tupled } from "@effect/data/Function";
import { prismaError } from "src/core/helpers/prisma";
import * as Renu from "src/core/effect/runtime";
import * as Telegram from "integrations/telegram/sendMessage";
import { fullOrderInclude } from "@integrations/core/clearing";
import * as Effect from "@effect/io/Effect";
import * as O from "@effect/data/Option";
import * as Equal from "@effect/data/Equal";
import * as A from "@effect/data/ReadonlyArray";
import * as Chunk from "@effect/data/Chunk";
import * as N from "@effect/data/Number";
import * as Ord from "@effect/data/typeclass/Order";
import * as S from "@effect/schema/Schema";
import * as P from "@effect/schema/Parser";
import * as Clearing from "@integrations/clearing";
import * as Gama from "@integrations/gama";
import * as _Menu from "../schema";
import * as _Item from "src/core/prisma/item";
import { Common, Number } from "shared/schema";
import { Item, Order } from "shared";
import { Modifiers } from "database-helpers";
import { inspect } from "util";

const ByItemModifierId = Ord.contramap(
  Ord.number,
  (it: ItemModifier | SendOrderModifiers) => it.id,
);
type ItemP = Prisma.ItemGetPayload<
  { include: { modifiers: true; content: true } }
>;

const parseOneOf = P.parse(Modifiers.OneOf);
const parseExtras = P.parse(Modifiers.Extras);

const createNewOrderModifier = (om: SendOrderModifiers, m: ItemModifier) =>
  Effect.gen(function* ($) {
    if (om._tag === "OneOf") {
      const oneOf = parseOneOf(m.config)

      return yield* $(
        pipe(
          Effect.find(
            oneOf.options,
            (o) => Effect.succeed(o.identifier === om.choice),
          ),
          Effect.someOrFailException,
          Effect.map((opt) =>
            Chunk.of(
              {
                amount: om.amount,
                price: opt.price,
                choice: om.choice,
                ref: oneOf.identifier,
                modifier: { connect: { id: m.id } },
              } satisfies Prisma.OrderItemModifierCreateWithoutReferencedInInput,
            )
          ),
        ),
      );
    }

    if (om._tag === "Extras") {
      const extras = parseExtras(m.config)

      const totalAmount = Chunk.reduce(om.choices, 0, (acc, [_, a]) => acc + a);
      if (
        !N.between(
          totalAmount,
          O.getOrElse(extras.min, () => 0),
          O.getOrElse(extras.max, () => Infinity),
        )
      ) {
        yield* $(Effect.dieMessage("not in range"));
      }

      return yield* $(
        Effect.collectAllPar(
          Chunk.map(om.choices, ([choice, amount]) =>
            pipe(
              Effect.find(extras.options, (o) =>
                Effect.succeed(o.identifier === choice)),
              Effect.someOrFailException,
              Effect.filterOrDieMessage(
                (o) =>
                  o.multi || amount === 1,
                "tried to order multiple of a singular option",
              ),
              Effect.map((o) => (
                {
                  amount,
                  price: o.price,
                  choice,
                  ref: extras.identifier,
                  modifier: { connect: { id: m.id } },
                } satisfies Prisma.OrderItemModifierCreateWithoutReferencedInInput
              )),
            )),
        ),
      );
    }

    absurd(om);
    return yield* $(Effect.dieMessage("unrecognized modifier"));
  });

const createNewOrder = (
  venue: Common.Slug,
  locale: Locale,
  zipped: Chunk.Chunk<readonly [ItemP, SendOrderItem]>,
) =>
  pipe(
    Effect.succeed(zipped),
    Effect.map(
      Chunk.map(
        ([it, oi]) =>
          [
            { ...oi, modifiers: A.sort(oi.modifiers, ByItemModifierId) },
            { ...it, modifiers: A.sort(it.modifiers, ByItemModifierId) },
          ] as const,
      ),
    ),
    Effect.filterOrDieMessage(
      Chunk.every(([oi, it]) => it.id === oi.item),
      "items not all equal",
    ),
    Effect.flatMap((zipped) =>
      Effect.collectAllPar(
        Chunk.map(zipped, ([oi, it]) =>
          pipe(
            Effect.succeed(A.zip(oi.modifiers, it.modifiers)),
            Effect.filterOrDieMessage(
              A.every(([itm, oim]) => itm.id === oim.id),
              "modifiers not all equal",
            ),
            Effect.map(A.map(tupled(createNewOrderModifier))),
            Effect.flatMap(Effect.collectAllPar),
            Effect.map(Chunk.flatten),
            Effect.filterOrDieMessage(
              (mods) =>
                Equal.equals(
                  pipe(
                    mods,
                    Chunk.map((om) => om.price * om.amount),
                    Chunk.append(it.price),
                    N.sumAll,
                    N.multiply(oi.amount),
                  ),
                  oi.cost,
                ),
              "reported wrong cost",
            ),
            Effect.map(
              (orderModifiers) => (
                {
                  item: { connect: { id: it.id } },
                  price: it.price,
                  comment: oi.comment ?? "",
                  name: pipe(
                    A.findFirst(it.content, (c) => c.locale === locale),
                    O.orElse(() => A.head(it.content)),
                    O.map((o) => o.name),
                    O.getOrElse(() => "Unknown"),
                  ),
                  quantity: oi.amount,
                  modifiers: {
                    create: A.fromIterable(orderModifiers),
                  },
                } satisfies Prisma.OrderItemCreateWithoutOrderInput
              ),
            ),
          )),
      )
    ),
    Effect.map(
      (orderItems) => (
        {
          venue: { connect: { identifier: venue } },
          state: "Init",
          items: {
            create: A.fromIterable(orderItems),
          },
        } satisfies Prisma.OrderCreateInput
      ),
    ),
    Effect.tap((order) =>
      Effect.sync(() => console.log(inspect(order, false, null, true)))
    ),
    Effect.flatMap((data) =>
      Effect.attemptCatchPromise(
        () =>
          db.order.create({
            data,
            include: fullOrderInclude,
          }),
        prismaError("Order"),
      )
    ),
  );

const getIntegration = (identifier: string) =>
  pipe(
    Effect.attemptCatchPromise(
      () =>
        db.clearingIntegration.findFirstOrThrow({
          where: { Venue: { identifier } },
        }),
      prismaError("ClearingIntegration"),
    ),
    Effect.tapError((e) =>
      Telegram.notify(
        e.code === "P2025"
          ? `venue ${identifier} has no clearing integration but tried to clear anyways.`
          : `prisma thrown an error while trying to get clearing integration for venue ${identifier}`,
      )
    ),
  );

const getItems = (venue: Common.Slug, ids: Chunk.Chunk<_Menu.ItemId>) =>
  pipe(
    Effect.attemptCatchPromise(
      () =>
        db.item.findMany({
          where: { AND: [_Item.belongsToVenue(venue), _Item.idIn(ids)] },
          orderBy: { id: "asc" },
          include: { modifiers: { where: { deleted: null } }, content: true },
        }),
      prismaError("Item"),
    ),
    Effect.filterOrDieMessage(
      (items) => items.length === ids.length,
      "not all items present in venue",
    ),
    Effect.map(Chunk.unsafeFromArray),
  );

const ByItemId = Ord.contramap(Ord.number, (it: SendOrderItem) => it.item);

const FullOrder = pipe(
  Order.Schema,
  S.extend(S.struct({
    items: pipe(
      Order.Item.Schema,
      S.extend(S.struct({
        item: Item.Schema,
        modifiers: pipe(
          Order.Modifier.Schema,
          S.extend(S.struct({
            modifier: Item.Modifier.Schema,
          })),
          S.array,
        ),
      })),
      S.array,
    ),
  })),
);

export default resolver.pipe((input: EncodedSendOrder) => {
  let _items: Chunk.Chunk<
    readonly [
      PItem & { modifiers: ItemModifier[]; content: ItemI18L[] },
      SendOrderItem,
    ]
  >;
  return pipe(
    P.decodeEffect(SendOrder)(input),
    Effect.orDie,
    Effect.bindValue(
      "sortedItems",
      ({ orderItems }) => Chunk.sort(orderItems, ByItemId),
    ),
    Effect.bind("items", ({ sortedItems, venueIdentifier }) =>
      Effect.map(
        getItems(
          venueIdentifier,
          Chunk.map(sortedItems, (it) => it.item),
        ),
        Chunk.zip(sortedItems),
      )),
    Effect.flatMap(({ items, venueIdentifier, locale }) => {
      _items = items;
      return createNewOrder(venueIdentifier, locale, items);
    }),
    a => a,
    Effect.flatMap((order) =>
      Effect.ifEffect(
        // Hack to work with papa
        Effect.succeed(input.venueIdentifier === "papa"),
        pipe(
          Effect.attemptCatchPromise(
            () =>
              db.order.update({
                where: { id: order.id },
                data: { state: OrderState.Unconfirmed },
                include: fullOrderInclude,
              }),
            prismaError("Order"),
          ),
          Effect.tap((order) =>
            Telegram.notify(`
Order ${order.id} received!

Customer ordered:
${
              Chunk.join(
                Chunk.map(
                  _items,
                  ([it, oi]) =>
                    `${oi.amount} x ${it.identifier} for ${
                      N.divide(oi.cost, 100).toLocaleString("us-IL", {
                        style: "currency",
                        currency: "ILS",
                      })
                    }`,
                ),
                `\n`,
              )
            }
`)
          ),
          Effect.flatMap(S.parseEffect(FullOrder)),
          Effect.flatMap((o) =>
            Effect.flatMap(Gama.Gama, (g) =>
              g.createSession({
                orderId: o.id,
                payerName: Gama.Schema.Name("datner"),
                venueName: Gama.Schema.Name("Papa"),
                paymentAmount: Number.Price(A.reduce(
                  o.items,
                  0,
                  (acc, it) =>
                    acc +
                    (N.sumAll(
                      A.append(it.price)(
                        A.map(it.modifiers, (m) => m.price * m.amount),
                      ),
                    ) * it.quantity),
                )),
                payerPhoneNumber: Gama.Schema.PhoneNumber("0502060633"),
              }))
          ),
        ),
        Clearing.getClearingPageLink(order),
      )
    ),
    a => a,
    Effect.provideServiceEffect(
      Clearing.IntegrationSettingsService,
      getIntegration(input.venueIdentifier),
    ),
    Renu.runPromise$,
  );
});
