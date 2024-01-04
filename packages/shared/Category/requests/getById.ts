import * as Models from "database";
import { Data, Request } from "effect";

export class GetCategoryByIdError extends Data.TaggedClass("GetCategoryByIdError")<{}> {}

export interface GetCategoryById extends Request.Request<GetCategoryByIdError, Models.Category> {
  readonly _tag: "GetCategoryById";
  readonly id: number;
}

export const GetCategoryById = Request.tagged<GetCategoryById>("GetCategoryById");
