import * as Models from "database";
import { Data, Request } from "effect";

export class GetCategoryContentError extends Data.TaggedClass("GetContentByCategoryIdError")<{}> {}

export interface GetCategoryContent extends Request.Request<GetCategoryContentError, Models.CategoryI18L[]> {
  readonly _tag: "GetCategoryContent";
  readonly id: number;
}

export const GetCategoryContent = Request.tagged<GetCategoryContent>("GetCategoryContent");
