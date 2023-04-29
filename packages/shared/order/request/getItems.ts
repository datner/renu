import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetOrderItemsError extends Data.TaggedClass("GetOrderItemsError")<{}> {}

export interface GetOrderItems
  extends Request.Request<GetOrderItemsError, Models.Prisma.OrderItemGetPayload<{ include: { modifiers: true } }>[]>
{
  readonly _tag: "GetOrderItems";
  readonly id: number;
}

export const GetOrderItems = Request.tagged<GetOrderItems>("GetOrderItems");
