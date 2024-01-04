import * as Models from "database";
import { Data, Request } from "effect";

export class GetItemModifiersError extends Data.TaggedClass("GetItemsModifiersIdError")<{}> {}

export interface GetItemModifiers extends Request.Request<GetItemModifiersError, ReadonlyArray<Models.ItemModifier>> {
  readonly _tag: "GetItemModifiers";
  readonly id: number;
}

export const GetItemModifiers = Request.tagged<GetItemModifiers>("GetItemModifiers");
