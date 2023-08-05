import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetOrderByIdError extends Data.TaggedClass("GetOrderByIdError")<{}> {}

export interface GetOrderById extends Request.Request<GetOrderByIdError, Models.Order> {
  readonly _tag: "GetOrderById";
  readonly id: number;
}

export const GetOrderById = Request.tagged<GetOrderById>("GetOrderById");
