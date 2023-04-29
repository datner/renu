import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetItemModifiersError extends Data.TaggedClass("GetItemsModifiersIdError")<{}> {}

export interface GetItemModifiers extends Request.Request<GetItemModifiersError, Models.ItemModifier[]> {
  readonly _tag: "GetItemModifiers";
  readonly id: number;
}

export const GetItemModifiers = Request.tagged<GetItemModifiers>("GetItemModifiers");
