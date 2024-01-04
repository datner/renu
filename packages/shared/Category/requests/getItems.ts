import * as Models from "database";
import { Data, Request } from "effect";

export class GetCategoryItemsError extends Data.TaggedClass("GetItemsByCategoryIdError")<{}> {}

export interface GetCategoryItems extends Request.Request<GetCategoryItemsError, Models.CategoryItem[]> {
  readonly _tag: "GetCategoryItems";
  readonly id: number;
}

export const GetCategoryItems = Request.tagged<GetCategoryItems>("GetCategoryItems");
