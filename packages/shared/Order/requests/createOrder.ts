import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class CreateOrderError extends Data.TaggedClass("CreateOrderError")<{}> {}

export interface CreateOrder extends Request.Request<CreateOrderError, Models.Order> {
  readonly _tag: "CreateOrder";
  readonly order: Models.Prisma.OrderCreateManyInput;
}

export const CreateOrder = Request.tagged<CreateOrder>("CreateOrder");
