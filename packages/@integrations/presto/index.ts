import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
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
  ) => Effect.Effect<Database.Database, never, Schema.To<typeof PrestoOrder>>;
}
export const Presto = Context.Tag<Presto, PrestoService>("Presto");

export const layer = Layer.effect(
  Presto,
  Effect.gen(function*(_) {
    const db = yield* _(Database.Database);

    return {
      postOrder: (orderId: Order.Id) =>
        pipe(
          Effect.gen(function*(_) {
            const o = yield* _(Schema.decodeEffect(FullOrder)(orderId));
            const mgmt = yield* _(Schema.decodeEffect(Venue.Management.fromVenue)(o.venueId));
            if (mgmt.provider !== "PRESTO") {
              throw yield* _(Effect.dieMessage("Wrong integration"));
            }
            const prestoOrder = yield* _(
              Schema.decodeEffect(PrestoOrder)({
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
                  id: i.item.managementRepresentation._tag === "Presto" ? i.item.managementRepresentation.id : -1,
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
                              price: i.price,
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
                              price: i.price,
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
                              price: i.price,
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
                  name: i.name,
                  itemcount: i.quantity,
                  price: i.price / 100,
                  comment: i.comment,
                })),
                comment: "Sent from Renu",
                price: o.totalCost / 100,
                delivery_fee: 0,
                orderCharges: [{ amount: 0 }],
                payments: [
                  {
                    type: "costtiket",
                    amount: o.totalCost / 100,
                    card: { number: "", expireMonth: 1, expireYear: 1, holderId: "", holderName: "" },
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
              }),
            );

            yield* _(
              Effect.acquireUseRelease(
                Effect.promise(async () => {
                  const client = new FTP.Client();
                  if (mgmt.provider !== "PRESTO") throw "fuck";

                  await client.access({
                    ...mgmt.vendorData,
                  });
                  return client;
                }),
                client => {
                  const s = new Readable();
                  s.push(JSON.stringify(prestoOrder));
                  s.push(null);
                  return Effect.promise(() => client.uploadFrom(s, `${Date.now()}.BOK`));
                },
                a => Effect.sync(() => a.close()),
              ),
            );

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

const order = {
  "id": 1010445,
  "contact": { "firstName": "", "lastName": "", "phone": "0523245471" },
  "delivery": {
    "type": "delivery",
    "address": {
      "formatted": ",   3 \/ ",
      "city": "",
      "street": " ",
      "number": "3",
      "entrance": "",
      "floor": "1",
      "apt": "",
      "comment": "",
    },
    "charge": 20,
    "numppl": 2,
    "workercode": 1,
  },
  "orderItems": [{
    "type": "item",
    "id": 55,
    "price": 49,
    "comment": " ",
    "children": [],
    "itemcount": 1,
    "name": " '",
    "childrencount": 0,
  }, {
    "type": "item",
    "id": 90,
    "price": 42,
    "comment": " ",
    "children": [],
    "itemcount": 1,
    "name": " ",
    "childrencount": 0,
  }, {
    "type": "item",
    "id": 20,
    "price": 53,
    "comment": " ",
    "children": [],
    "itemcount": 1,
    "name": "",
    "childrencount": 0,
  }, {
    "type": "item",
    "id": 520,
    "price": 54,
    "comment": "",
    "children": [],
    "itemcount": 1,
    "name": "  ",
    "childrencount": 0,
  }, {
    "type": "item",
    "id": 60,
    "price": 0,
    "comment": "",
    "itemcount": 3,
    "children": [],
    "name": "",
    "childrencount": 0,
  }, {
    "type": "item",
    "id": 88,
    "price": 0,
    "comment": "",
    "itemcount": 3,
    "children": [],
    "name": "  ",
    "childrencount": 0,
  }, {
    "type": "item",
    "id": 487,
    "price": 0,
    "comment": "",
    "children": [],
    "itemcount": 1,
    "name": "hiyashi oshi salad",
    "childrencount": 0,
  }],
  "comment": "",
  "takeoutPacks": 2,
  "orderCharges": [{ "amount": 0 }],
  "price": 218,
  "payments": [{
    "type": "costtiket",
    "amount": 117,
    "card": { "number": "5", "expireMonth": 1, "expireYear": 1, "holderId": "", "holderName": "" },
  }, {
    "type": "costtiket",
    "amount": 101,
    "card": { "number": "5", "expireMonth": 1, "expireYear": 1, "holderId": "", "holderName": "" },
  }, {
    "type": "cash",
    "amount": 1,
    "card": { "number": "", "expireMonth": 1, "expireYear": 1, "holderId": "", "holderName": "" },
  }],
  "delivery_fee": 20,
};
