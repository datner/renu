import * as Models from "database";
import { Data, Request } from "effect";

export class GetOrderByIdError extends Data.TaggedClass("GetOrderByIdError")<{}> {}

export interface GetOrderById extends Request.Request<GetOrderByIdError, Models.Order> {
  readonly _tag: "GetOrderById";
  readonly id: number;
}

export const GetOrderById = Request.tagged<GetOrderById>("GetOrderById");
