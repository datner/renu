import * as Models from "database";
import { Data, Request } from "effect";

export class CreateOrderItemModifierError extends Data.TaggedClass("CreateOrderItemModifierError")<{}> {}

export interface CreateOrderItemModifier
  extends Request.Request<CreateOrderItemModifierError, Models.OrderItemModifier>
{
  readonly _tag: "CreateOrderItemModifierItem";
  readonly modifier: Models.Prisma.OrderItemModifierCreateManyInput;
}

export const CreateOrderItemModifier = Request.tagged<CreateOrderItemModifier>("CreateOrderItemModifierItem");
