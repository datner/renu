import { Effect, pipe, ReadonlyArray, Request, RequestResolver } from "effect";
import { Database, DB } from "../../Database";
import { CreateFullOrder } from "./createFullOrder";
import { GetOrderById } from "./getById";
import { GetOrderItemModifiers } from "./getItemModifiers";
import { GetOrderItems } from "./getItems";
import { SetOrderTransactionId } from "./setTransactionId";

type OrderRequest =
  | GetOrderItemModifiers
  | GetOrderItems
  | GetOrderById
  | CreateFullOrder
  | SetOrderTransactionId;

export const OrderResolver = pipe(
  RequestResolver.makeBatched<DB, OrderRequest>((
    requests,
  ) => {
    const reqMap = ReadonlyArray.groupBy(requests, _ => _._tag);
    const byId = reqMap.GetOrderById as GetOrderById[] ?? [];
    const items = reqMap.GetOrderItems as GetOrderItems[] ?? [];
    const modifiers = reqMap.GetOrderItemModifiers as GetOrderItemModifiers[] ?? [];
    const create = reqMap.CreateFullOrder as CreateFullOrder[] ?? [];
    const setTxId = reqMap.SetOrderTransactionId as SetOrderTransactionId[] ?? [];

    return Effect.andThen(Database, db =>
      Effect.all({
        GetOrderById: Effect.promise(() =>
          db.order.findMany({
            where: { id: { in: byId.map(req => req.id) } },
          })
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(byId)),
          Effect.flatMap(
            Effect.forEach(([order, req]) => Request.succeed(req, order)),
          ),
        ),
        GetorderItems: Effect.promise(() =>
          Promise.all(
            items.map(_ =>
              db.order.findUnique({ where: { id: _.id } }).items({
                include: { modifiers: true },
              })
            ),
          )
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(items)),
          Effect.flatMap(
            Effect.forEach(([item, req]) => Request.succeed(req, item ?? [])),
          ),
        ),
        GetOrderItemModifiers: Effect.promise(() =>
          Promise.all(
            modifiers.map(_ => db.orderItem.findUnique({ where: { id: _.id } }).modifiers()),
          )
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(modifiers)),
          Effect.flatMap(
            Effect.forEach(([mods, req]) => Request.succeed(req, mods ?? [])),
          ),
        ),
        SetModifierConfig: Effect.promise(() =>
          db.$transaction(
            create.map(_ => db.order.create({ data: _.order })),
          )
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(create)),
          Effect.flatMap(
            Effect.forEach(([ord, req]) => Request.succeed(req, ord)),
          ),
        ),
        SetOrderTransactionId: Effect.promise(() =>
          db.$transaction(
            setTxId.map(_ =>
              db.order.update({
                where: {
                  id: _.id,
                },
                data: { txId: _.transactionId },
              })
            ),
          )
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(setTxId)),
          Effect.flatMap(
            Effect.forEach(([ord, req]) => Request.succeed(req, ord)),
          ),
        ),
      }));
  }),
  RequestResolver.contextFromServices(Database),
);
