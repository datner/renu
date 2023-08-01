import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Exit from "@effect/io/Exit";
import * as Request from "@effect/io/Request";
import * as RequestResolver from "@effect/io/RequestResolver";
import { inspect } from "util";
import { Database } from "../../Database";
import { filterRequestsByTag, resolveBatch, resolveSingle } from "../../effect/Request";
import { CreateFullOrder } from "./createFullOrder";
import { GetOrderById, GetOrderByIdError } from "./getById";
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
  RequestResolver.makeBatched((
    requests: OrderRequest[],
  ) =>
    Effect.all([
      Effect.sync(() => console.log(inspect(requests.map(r => r._tag), false, null, true))),
      resolveBatch(
        filterRequestsByTag(requests, "GetOrderItems"),
        (reqs, db) =>
          db.orderItem.findMany({
            where: { orderId: { in: reqs.map(req => req.id) } },
            orderBy: { orderId: "asc" },
            include: { modifiers: true },
          }),
        r => String(r.id),
        d => String(d.orderId),
      ),
      resolveSingle(
        filterRequestsByTag(requests, "GetOrderById"),
        (reqs, db) =>
          db.order.findMany({
            where: { id: { in: reqs.map(_ => _.id) } },
          }),
        (req, items) =>
          Option.match(
            A.findFirst(items, _ => _.id === req.id),
            {
              onNone: () => Exit.fail(new GetOrderByIdError()),
              onSome: Exit.succeed,
            },
          ),
      ),
      pipe(
        filterRequestsByTag(requests, "CreateFullOrder"),
        Effect.forEach(req =>
          pipe(
            Effect.flatMap(
              Database,
              db => Effect.promise(() => db.order.create({ data: req.order })),
            ),
            Effect.flatMap(order => Request.succeed(req, order)),
          ), { concurrency: 5 }),
      ),
      pipe(
        filterRequestsByTag(requests, "SetOrderTransactionId"),
        Effect.forEach(req =>
          pipe(
            Effect.flatMap(
              Database,
              db =>
                Effect.promise(() =>
                  db.order.update({ where: { id: req.id }, data: { txId: req.transactionId, state: "PaidFor" } })
                ),
            ),
            Effect.flatMap(order => Request.succeed(req, order)),
          ), { concurrency: 5 }),
      ),
    ], { concurrency: "unbounded" })
  ),
  RequestResolver.contextFromServices(Database),
);
