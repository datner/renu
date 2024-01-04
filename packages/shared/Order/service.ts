import * as Schema from "@effect/schema/Schema";
import { OrderState } from "database";
import { Context, Data, Effect, Exit, Layer, Option, Request, RequestResolver } from "effect";
import { Database } from "../Database";
import * as Item from "../Item/item";
import * as ItemModifier from "../Item/modifier";
import * as internal from "./internal/service";
import * as OrderItem from "./item";
import * as OrderModifier from "./modifier";
import * as Order from "./order";

// ========== Models ==========

export interface Orders {
  readonly _: unique symbol;
}

export class OrdersError extends Data.TaggedClass("OrdersError")<{}> {}

// ========== Requests ==========

interface GetById extends Request.Request<OrdersError, Order.Order> {
  readonly _tag: "Orders.GetById";
  readonly id: number;
}
const GetById = Request.tagged<GetById>("Orders.GetById");

interface GetByCuid extends Request.Request<OrdersError, Order.Order> {
  readonly _tag: "Orders.GetByCuid";
  readonly cuid: string;
}
const GetByCuid = Request.tagged<GetByCuid>("Orders.GetByCuid");

interface GetItemsById extends Request.Request<OrdersError, ReadonlyArray<OrderItem.Item & { item: Item.Decoded }>> {
  readonly _tag: "Orders.GetItemsById";
  readonly id: number;
}
const GetItemsById = Request.tagged<GetItemsById>("Orders.GetItemsById");

interface GetModifiersByItemId extends Request.Request<OrdersError, ReadonlyArray<OrderModifier.ModifierWithRef>> {
  readonly _tag: "Orders.GetModifiersByItemId";
  readonly id: number;
}
const GetModifiersByItemId = Request.tagged<GetModifiersByItemId>("Orders.GetModifiersByItemId");

type FullOrder = Order.Order & {
  items: ReadonlyArray<
    OrderItem.Item & {
      item: Item.Decoded;
      modifiers: ReadonlyArray<
        OrderModifier.Modifier & { modifier: ItemModifier.Modifier }
      >;
    }
  >;
};
interface GetFullOrder extends Request.Request<OrdersError, FullOrder> {
  readonly _tag: "Orders.GetFullOrder";
  readonly id: number;
}
const GetFullOrder = Request.tagged<GetFullOrder>("Orders.GetFullOrder");

interface SetOrderState extends Request.Request<OrdersError, void> {
  readonly _tag: "Order.SetOrderState";
  readonly id: number;
  readonly state: OrderState;
}
const SetOrderState = Request.tagged<SetOrderState>("Order.SetOrderState");

// ========== Service ==========

const OrdersService = Effect.gen(function*(_) {
  const db = yield* _(Database);

  const getByIdResolver = RequestResolver.makeBatched<never, GetById>(
    Effect.forEach(req =>
      Effect.tryPromise(() => db.order.findUnique({ where: { id: req.id } })).pipe(
        Effect.flatMap(Option.fromNullable),
        Effect.flatMap(Schema.decode(Order.Order)),
        Effect.mapError(() => new OrdersError()),
        Effect.tap(_ =>
          Effect.fromNullable(_.cuid).pipe(
            Effect.flatMap(cuid => Effect.cacheRequestResult(GetByCuid({ cuid }), Exit.succeed(_))),
            Effect.ignore,
          )
        ),
        Effect.exit,
        Effect.flatMap(_ => Request.complete(req, _)),
      ), { concurrency: "inherit", discard: true }),
  );
  const getById = (id: number) =>
    Effect.request(
      GetById({ id }),
      getByIdResolver,
    ).pipe(Effect.withRequestCaching(true));

  const getByCuidResolver = RequestResolver.makeBatched<never, GetByCuid>(
    Effect.forEach(req =>
      Effect.tryPromise(() => db.order.findUnique({ where: { cuid: req.cuid } })).pipe(
        Effect.flatMap(Option.fromNullable),
        Effect.flatMap(Schema.decode(Order.Order)),
        Effect.mapError(() => new OrdersError()),
        Effect.tap(_ => Effect.cacheRequestResult(GetById({ id: _.id }), Exit.succeed(_))),
        Effect.exit,
        Effect.flatMap(_ => Request.complete(req, _)),
      ), { concurrency: "inherit", discard: true }),
  );
  const getByCuid = (cuid: string) =>
    Effect.request(
      GetByCuid({ cuid }),
      getByCuidResolver,
    ).pipe(Effect.withRequestCaching(true));

  const getItemsByIdResolver = RequestResolver.makeBatched<never, GetItemsById>(
    Effect.forEach(
      req =>
        Effect.tryPromise(
          () => db.order.findUnique({ where: { id: req.id } }).items({ include: { item: true } }),
        ).pipe(
          Effect.flatMap(Option.fromNullable),
          Effect.flatMap(Schema.decode(Schema.array(
            OrderItem.Item
              .extend<OrderItem.Item & { item: Item.Item }>()({ item: Item.Item }),
          ))),
          Effect.mapError(() => new OrdersError()),
          Effect.exit,
          Effect.flatMap(_ => Request.complete(req, _)),
        ),
      { concurrency: "inherit", discard: true },
    ),
  );
  const getItemsById = (id: number) =>
    Effect.request(
      GetItemsById({ id }),
      getItemsByIdResolver,
    ).pipe(Effect.withRequestCaching(true));

  const parse = Schema.parse(Schema.array(OrderModifier.ModifierWithRef));
  const getModifiersByItemIdResolver = RequestResolver.makeBatched<never, GetModifiersByItemId>(_ =>
    Effect.forEach(
      _,
      req =>
        Effect.tryPromise(() =>
          db.orderItem.findUnique({ where: { id: req.id } }).modifiers({ include: { modifier: true } })
        ).pipe(
          Effect.flatMap(Option.fromNullable),
          Effect.flatMap(parse),
          Effect.mapError(() => new OrdersError()),
          Effect.exit,
          Effect.flatMap(_ => Request.complete(req, _)),
        ),
      { concurrency: "inherit", discard: true },
    )
  );
  const getModifiersByItemId = (id: number) =>
    Effect.request(
      GetModifiersByItemId({ id }),
      getModifiersByItemIdResolver,
    ).pipe(Effect.withRequestCaching(true));

  const getFullOrderResolver = RequestResolver.makeBatched<never, GetFullOrder>(
    Effect.forEach(
      req =>
        getById(req.id).pipe(
          Effect.bind("items", _ =>
            getItemsById(_.id).pipe(
              Effect.flatMap(
                Effect.forEach(item =>
                  Effect.map(
                    getModifiersByItemId(item.id),
                    modifiers => ({ ...item, modifiers }),
                  )
                ),
              ),
            )),
          Effect.mapError(() => new OrdersError()),
          Effect.exit,
          Effect.flatMap(_ => Request.complete(req, _)),
        ),
      { concurrency: "inherit", discard: true },
    ),
  );
  const getFullOrder = (id: number) =>
    Effect.request(
      GetFullOrder({ id }),
      getFullOrderResolver,
    ).pipe(Effect.withRequestCaching(true));

  const setOrderStateResolver = RequestResolver.fromEffect<never, SetOrderState>(req =>
    Effect.tryPromise(() => db.order.update({ where: { id: req.id }, data: { state: req.state } })).pipe(
      Effect.flatMap(Schema.decode(Order.Order)),
      Effect.mapError(() => new OrdersError()),
      Effect.tap(_ =>
        Effect.fromNullable(_.cuid).pipe(
          Effect.flatMap(cuid => Effect.cacheRequestResult(GetByCuid({ cuid }), Exit.succeed(_))),
          Effect.ignore,
        )
      ),
      Effect.tap(_ => Effect.cacheRequestResult(GetById({ id: _.id }), Exit.succeed(_))),
      Effect.asUnit,
      Effect.exit,
      Effect.flatMap(_ => Request.complete(req, _)),
    )
  );

  const setOrderState = (id: number, state: OrderState) =>
    Effect.request(
      SetOrderState({ id, state }),
      setOrderStateResolver,
    );

  return {
    getById,
    getByCuid,
    getItemsById,
    getModifiersByItemId,
    getFullOrder,
    setOrderState,
  };
});
export interface OrdersService extends Effect.Effect.Success<typeof OrdersService> {}

// ========== Context ==========

export const tag: Context.Tag<Orders, OrdersService> = internal.tag;

export const layer = Layer.effect(tag, OrdersService);

// ========== API ==========

export const {
  getById,
  getByCuid,
  getFullOrder,
  getItemsById,
  getModifiersByItemId,
  setOrderState,
} = Effect.serviceFunctions(tag);
