import * as Effect from "@effect/io/Effect";
import { Prisma } from "database";
import { CreateFullOrder } from "./createFullOrder";
import { GetOrderById } from "./getById";
import { GetOrderItems } from "./getItems";
import { OrderResolver } from "./resolver";

export const getItems = (id: number) =>
  Effect.withRequestBatching("on")(Effect.request(
    GetOrderItems({ id }),
    OrderResolver,
  ));

export const getById = (id: number) =>
  Effect.withRequestBatching("on")(Effect.request(
    GetOrderById({ id }),
    OrderResolver,
  ));

export const createDeepOrder = <I extends Prisma.OrderInclude>(order: Prisma.OrderCreateInput, include: I) =>
  Effect.request(
    CreateFullOrder({ order, include }) as CreateFullOrder<I>,
    OrderResolver,
  );
