import { Context } from "effect";
import type { Orders, OrdersService } from "../service";

export const tag = Context.Tag<Orders, OrdersService>("Orders");
