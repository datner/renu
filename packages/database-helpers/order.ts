import { Prisma } from "database";
import { Context, Effect } from "effect";
import { Order } from "shared";

export interface OrderRepository {
  readonly getOrder: <Get extends Prisma.OrderDefaultArgs>(
    id: Order.Id,
    args: Get,
  ) => Effect.Effect<never, never, Prisma.OrderGetPayload<Get>>;
  readonly setTransactionId: (orderId: Order.Id, txId: Order.TxId) => Effect.Effect<never, never, Order.Decoded>;
}
export const OrderRepository = Context.Tag<OrderRepository>("OrderRepository");
