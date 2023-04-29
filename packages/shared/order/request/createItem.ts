import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class CreateOrderItemError extends Data.TaggedClass("CreateOrderItemError")<{}> {}

export interface CreateOrderItem extends Request.Request<CreateOrderItemError, Models.OrderItem> {
  readonly _tag: "CreateOrderItem";
  readonly item: Models.Prisma.OrderItemCreateManyInput
  readonly modifiers: Models.Prisma.OrderItemModifierCreateManyInput[]
}

export const CreateOrderItem = Request.tagged<CreateOrderItem>("CreateOrderItem");



