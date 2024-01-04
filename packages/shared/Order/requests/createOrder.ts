import * as Models from "database";
import { Data, Request } from "effect";

export class CreateOrderError extends Data.TaggedClass("CreateOrderError")<{}> {}

export interface CreateOrder extends Request.Request<CreateOrderError, Models.Order> {
  readonly _tag: "CreateOrder";
  readonly order: Models.Prisma.OrderCreateManyInput;
}

export const CreateOrder = Request.tagged<CreateOrder>("CreateOrder");
