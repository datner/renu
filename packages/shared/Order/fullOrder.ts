import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as ParseResult from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";
import { Database } from "../Database";
import { accessing } from "../effect/Context";
import * as Item from "../Item/item";
import * as ItemModifier from "../Item/modifier";
import * as ItemRequest from "../Item/requests";
import * as OI from "./item";
import * as OrderModifier from "./modifier";
import * as Order from "./order";
import * as OrderRequest from "./requests";

export const OrderItemModifier = pipe(
  OrderModifier.Schema,
  Schema.extend(Schema.struct({ modifier: ItemModifier.fromPrisma })),
);

export const OrderItem = Schema.transformResult(
  Schema.from(pipe(
    OI.Schema,
    Schema.extend(Schema.struct({ modifiers: Schema.array(OrderModifier.Schema) })),
  )),
  pipe(
    OI.Schema,
    Schema.extend(Schema.struct({ item: Item.Item, modifiers: Schema.array(OrderItemModifier) })),
  ),
  i =>
    pipe(
      Effect.all({
        item: ItemRequest.getById(i.itemId),
        modifiers: pipe(
          Effect.forEach(
            i.modifiers,
            m => Effect.zip(Effect.succeed(m), ItemRequest.getModifierById(m.itemModifierId)),
            { batching: true },
          ),
          Effect.map(A.map(([m, modifier]) => ({ ...m, modifier }))),
        ),
      }, { concurrency: 2 }),
      Effect.map((ex) => ({ ...i, ...ex })),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    ),
  ParseResult.success,
);

export const FullOrder = Schema.transformResult(
  Order.Id,
  pipe(Schema.to(Order.Schema), Schema.extend(Schema.struct({ items: Schema.array(OrderItem) }))),
  (id) =>
    pipe(
      Effect.zip(
        Effect.flatMap(OrderRequest.getById(id), Schema.decode(Order.Schema)),
        Effect.flatMap(OrderRequest.getItems(id), Schema.decode(Schema.array(OrderItem))),
        { concurrent: true },
      ),
      Effect.map(([order, items]) => ({ ...order, items })),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    ),
  _ => ParseResult.success(_.id),
);
export interface FullOrder extends Schema.To<typeof FullOrder> {}
