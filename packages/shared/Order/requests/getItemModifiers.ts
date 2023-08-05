import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetOrderItemModifiersError extends Data.TaggedClass("GetOrderItemModifiersError")<{}> {}

export interface GetOrderItemModifiers extends Request.Request<GetOrderItemModifiersError, Models.OrderItemModifier[]> {
  readonly _tag: "GetOrderItemModifiers";
  readonly id: number;
}

export const GetOrderItemModifiers = Request.tagged<GetOrderItemModifiers>("GetOrderItemModifiers");
