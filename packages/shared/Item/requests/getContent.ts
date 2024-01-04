import * as Models from "database";
import { Data, Request } from "effect";

export class GetItemContentError extends Data.TaggedClass("GetContentByItemIdError")<{}> {}

export interface GetItemContent extends Request.Request<GetItemContentError, ReadonlyArray<Models.ItemI18L>> {
  readonly _tag: "GetItemContent";
  readonly id: number;
}

export const GetItemContent = Request.tagged<GetItemContent>("GetItemContent");
