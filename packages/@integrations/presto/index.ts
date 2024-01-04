import * as Schema from "@effect/schema/Schema";
import * as FTP from "basic-ftp";
import { Context, Effect, Layer, Match, Option, pipe, ReadonlyArray, Ref } from "effect";
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
  ) => Effect.Effect<never, never, Schema.Schema.To<typeof PrestoOrder>>;
}
export const Presto = Context.Tag<Presto, PrestoService>("Presto");

const toPrestoOrder = (o: FullOrder, serviceCharge: number) =>
  Schema.encode(PrestoOrder)({
    id: o.id,
    contact: {
      firstName: Option.getOrElse(o.customerName, () => "Anonymous"),
      lastName: "",
      phone: pipe(
        Option.map(o.managementExtra, _ => _.phoneNumber),
        Option.getOrElse(() => "0505555555"),
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
        ReadonlyArray.map(i =>
          pipe(
            Match.value(i.modifier.config),
            Match.tag("oneOf", o =>
              pipe(
                o.options,
                ReadonlyArray.findFirst(_ => _.identifier === i.choice),
                Option.map(_ => _.managementRepresentation),
                Option.filterMap(refineTag("Presto")),
                Option.map(_ => _.id),
                Option.map(id => ({
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
                ReadonlyArray.findFirst(_ => _.identifier === i.choice),
                Option.map(_ => _.managementRepresentation),
                Option.filterMap(refineTag("Presto")),
                Option.map(_ => _.id),
                Option.map(id => ({
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
                ReadonlyArray.findFirst(_ => _.identifier === i.choice),
                Option.map(_ => _.managementRepresentation),
                Option.filterMap(refineTag("Presto")),
                Option.map(_ => _.id),
                Option.map(id => ({
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
        ReadonlyArray.getSomes,
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
      charge: serviceCharge / 100,
      numppl: 1,
      workercode: 1,
    },
    comment: "Sent from Renu",
    price: (o.totalCost + serviceCharge) / 100,
    delivery_fee: serviceCharge / 100,
    orderCharges: [{ amount: 0 }],
    payments: [
      {
        type: "costtiket",
        amount: (o.totalCost + serviceCharge) / 100,
        card: { number: "10", expireMonth: 1, expireYear: 1, holderId: "", holderName: "" },
      },
    ],
    takeoutPacks: 1,
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
            const clearing = yield* _(Schema.decode(Venue.Clearing.fromVenue)(o.venueId), Effect.flatten);
            if (mgmt.provider !== "PRESTO") {
              throw yield* _(Effect.dieMessage("Wrong integration"));
            }

            const serviceCharge = (clearing.provider === "PAY_PLUS"
              ? clearing.vendorData.service_charge
              : Option.none())
              .pipe(Option.getOrElse(() => 0));

            const prestoOrder = yield* _(toPrestoOrder(o, serviceCharge));

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
