import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class CreateFullOrderError extends Data.TaggedClass("CreateFullOrderError")<{}> {}

export interface CreateFullOrder extends Request.Request<CreateFullOrderError, Models.Order> {
  readonly _tag: "CreateFullOrder";
  readonly order: Models.Prisma.OrderCreateInput;
}

export const CreateFullOrder = Request.tagged<CreateFullOrder>("CreateFullOrder");
