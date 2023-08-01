import * as Effect from "@effect/io/Effect";
import { Prisma } from "database";
import * as Order from "../order";
import { CreateFullOrder } from "./createFullOrder";
import { GetOrderById } from "./getById";
import { GetOrderItems } from "./getItems";
import { OrderResolver } from "./resolver";
import { SetOrderTransactionId } from "./setTransactionId";
export { setOrderState } from "./setOrderState";

export const getItems = (id: number) =>
  Effect.withRequestCaching(true)(Effect.request(
    GetOrderItems({ id }),
    OrderResolver,
  ));

export const getById = (id: number) =>
  Effect.request(
    GetOrderById({ id }),
    OrderResolver,
  );

export const createDeepOrder = (order: Prisma.OrderCreateInput) =>
  Effect.request(
    CreateFullOrder({ order }),
    OrderResolver,
  );

export const setTransactionId = (id: Order.Id, transactionId: Order.TxId) =>
  Effect.request(
    SetOrderTransactionId({ id, transactionId }),
    OrderResolver,
  );
