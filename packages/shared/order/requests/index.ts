import * as Effect from "@effect/io/Effect";
import { Prisma } from "database";
import { CreateFullOrder } from "./createFullOrder";
import { GetOrderById } from "./getById";
import { GetOrderItems } from "./getItems";
import { OrderResolver } from "./resolver";

export const getItems = (id: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetOrderItems({ id }),
    OrderResolver,
  ));

export const getById = (id: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetOrderById({ id }),
    OrderResolver,
  ));

export const createDeepOrder = (order: Prisma.OrderCreateInput) =>
  Effect.request(
    CreateFullOrder({ order }),
    OrderResolver,
  );
