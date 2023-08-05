import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class CreateOrderItemModifierError extends Data.TaggedClass("CreateOrderItemModifierError")<{}> {}

export interface CreateOrderItemModifier
  extends Request.Request<CreateOrderItemModifierError, Models.OrderItemModifier>
{
  readonly _tag: "CreateOrderItemModifierItem";
  readonly modifier: Models.Prisma.OrderItemModifierCreateManyInput;
}

export const CreateOrderItemModifier = Request.tagged<CreateOrderItemModifier>("CreateOrderItemModifierItem");
