import * as Models from "database";
import { Data, Request } from "effect";

export class GetOrderItemModifiersError extends Data.TaggedClass("GetOrderItemModifiersError")<{}> {}

export interface GetOrderItemModifiers extends Request.Request<GetOrderItemModifiersError, Models.OrderItemModifier[]> {
  readonly _tag: "GetOrderItemModifiers";
  readonly id: number;
}

export const GetOrderItemModifiers = Request.tagged<GetOrderItemModifiers>("GetOrderItemModifiers");
