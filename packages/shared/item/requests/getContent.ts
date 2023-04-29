import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetItemContentError extends Data.TaggedClass("GetContentByItemIdError")<{}> {}

export interface GetItemContent extends Request.Request<GetItemContentError, Models.ItemI18L[]> {
  readonly _tag: "GetItemContent";
  readonly id: number;
}

export const GetItemContent = Request.tagged<GetItemContent>("GetItemContent");
