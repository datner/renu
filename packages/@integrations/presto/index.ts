import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as Ref from "@effect/io/Ref";
import * as Match from "@effect/match";
import * as Schema from "@effect/schema/Schema";
import * as FTP from "basic-ftp";
import { Database, Order, Venue } from "shared";
import { refineTag } from "shared/effect/Refinement";
import { FullOrder } from "shared/Order/fullOrder";
import { Readable } from "stream";

interface Presto {
  readonly _tag: unique symbol;
}

export interface PrestoService {
  readonly postOrder: (
    orderId: Order.Id,
  ) => Effect.Effect<never, never, Schema.To<typeof PrestoOrder>>;
}
export const Presto = Context.Tag<Presto, PrestoService>("Presto");

const toPrestoOrder = (o: FullOrder) =>
  Schema.encode(PrestoOrder)({
    id: o.id,
    contact: {
      firstName: O.getOrElse(o.customerName, () => "Anonymous"),
      lastName: "",
      phone: pipe(
        O.map(o.managementExtra, _ => _.phoneNumber),
        O.getOrElse(() => "0505555555"),
      ),
    },
    orderItems: o.items.map(i => ({
      type: "item" as const,
      // TODO: disallow no representation
      id: i.item.managementRepresentation._tag === "Presto" ? i.item.managementRepresentation.id : -10,
      name: i.name,
      itemcount: i.quantity,
      price: i.price / 100,
      comment: i.comment,
      childrencount: 0,
      children: pipe(
        i.modifiers,
        A.map(i =>
          pipe(
            Match.value(i.modifier.config),
            Match.tag("oneOf", o =>
              pipe(
                o.options,
                A.findFirst(_ => _.identifier === i.choice),
                O.map(_ => _.managementRepresentation),
                O.filterMap(refineTag("Presto")),
                O.map(_ => _.id),
                O.map(id => ({
                  type: "option" as const,
                  id,
                  price: i.price / 100,
                  comment: "",
                  name: i.choice,
                  itemcount: i.amount,
                })),
              )),
            Match.tag("extras", o =>
              pipe(
                o.options,
                A.findFirst(_ => _.identifier === i.choice),
                O.map(_ => _.managementRepresentation),
                O.filterMap(refineTag("Presto")),
                O.map(_ => _.id),
                O.map(id => ({
                  type: "option" as const,
                  id,
                  price: i.price / 100,
                  comment: "",
                  name: i.choice,
                  itemcount: i.amount,
                })),
              )),
            Match.tag("Slider", o =>
              pipe(
                o.options,
                A.findFirst(_ => _.identifier === i.choice),
                O.map(_ => _.managementRepresentation),
                O.filterMap(refineTag("Presto")),
                O.map(_ => _.id),
                O.map(id => ({
                  type: "option" as const,
                  id,
                  price: i.price / 100,
                  comment: "",
                  name: i.choice,
                  itemcount: i.amount,
                })),
              )),
            Match.exhaustive,
          )
        ),
        A.compact,
      ),
    }))
      .flatMap(i => (i.id === -1
        ? i.children.map(c => ({
          type: "item" as const,
          id: c.id,
          name: c.name,
          itemcount: c.itemcount,
          price: c.price,
          comment: c.comment,
          childrencount: 0,
          children: [],
        }))
        : [i])
      )
      .map(i => ({
        ...i,
        childrencount: i.children.length,
      })),
    comment: "Sent from Renu",
    price: o.totalCost / 100,
    delivery_fee: 0,
    orderCharges: [{ amount: 0 }],
    payments: [
      {
        type: "costtiket",
        amount: o.totalCost / 100,
        card: { number: "10", expireMonth: 1, expireYear: 1, holderId: "", holderName: "" },
      },
    ],
    takeoutPacks: 1,
    delivery: {
      type: "delivery",
      address: {
        formatted: "",
        city: "",
        street: " ",
        number: "3",
        entrance: "",
        floor: "1",
        apt: "",
        comment: "",
      },
      charge: 0,
      numppl: 1,
      workercode: 1,
    },
  });

export const layer = Layer.effect(
  Presto,
  Effect.gen(function*(_) {
    const db = yield* _(Database.Database);
    const sem = yield* _(Effect.makeSemaphore(1));
    const client = yield* _(Ref.make(new FTP.Client()));

    const FTPClient = Effect.acquireRelease(
      Effect.tap(Ref.get(client), () => sem.take(1)),
      (_) => Effect.tap(Effect.sync(() => _.close()), () => sem.release(1)),
    );

    return {
      postOrder: (orderId: Order.Id) =>
        pipe(
          Effect.gen(function*(_) {
            const o = yield* _(Schema.decode(FullOrder)(orderId));
            const mgmt = yield* _(Schema.decode(Venue.Management.fromVenue)(o.venueId));
            if (mgmt.provider !== "PRESTO") {
              throw yield* _(Effect.dieMessage("Wrong integration"));
            }

            const prestoOrder = yield* _(toPrestoOrder(o));

            if (process.env.NODE_ENV === "production") {
              yield* _(
                FTPClient,
                Effect.tap(_ => Effect.promise(() => _.access(mgmt.vendorData))),
                Effect.flatMap(_ =>
                  Effect.promise(() => {
                    const s = new Readable();
                    s.push(JSON.stringify(prestoOrder));
                    s.push(null);
                    return _.uploadFrom(s, `renu-${Date.now()}.BOK`);
                  })
                ),
                Effect.scoped,
              );
            }
            return prestoOrder;
          }),
          Effect.provideService(Database.Database, db),
          Effect.orDie,
        ),
    };
  }),
);

const PrestoOrder = Schema.struct({
  id: Schema.number,
  contact: Schema.struct({
    firstName: Schema.string,
    lastName: Schema.string,
    phone: Schema.string,
  }),
  delivery: Schema.struct({
    type: Schema.string,
    address: Schema.struct({
      formatted: Schema.string,
      city: Schema.string,
      street: Schema.string,
      number: Schema.string,
      entrance: Schema.string,
      floor: Schema.string,
      apt: Schema.string,
      comment: Schema.string,
    }),
    charge: Schema.number,
    numppl: Schema.number,
    workercode: Schema.number,
  }),
  orderItems: Schema.array(
    Schema.struct({
      type: Schema.literal("item"),
      id: Schema.number,
      price: Schema.number,
      comment: Schema.string,
      itemcount: Schema.number,
      name: Schema.string,
      childrencount: Schema.number,
      children: Schema.array(Schema.struct({
        type: Schema.literal("option"),
        id: Schema.number,
        price: Schema.number,
        comment: Schema.string,
        itemcount: Schema.number,
        name: Schema.string,
      })),
    }),
  ),
  comment: Schema.string,
  takeoutPacks: Schema.number,
  orderCharges: Schema.array(Schema.struct({ amount: Schema.number })),
  price: Schema.number,
  payments: Schema.array(
    Schema.struct({
      type: Schema.string,
      amount: Schema.number,
      card: Schema.struct({
        number: Schema.string,
        expireMonth: Schema.number,
        expireYear: Schema.number,
        holderId: Schema.string,
        holderName: Schema.string,
      }),
    }),
  ),
  delivery_fee: Schema.number,
});
