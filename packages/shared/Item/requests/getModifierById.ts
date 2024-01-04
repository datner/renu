import * as Models from "database";
import { Data, Request } from "effect";

export class GetItemModifierByIdError extends Data.TaggedClass("GetItemModifierByIdError")<{}> {}

export interface GetItemModifierById extends Request.Request<GetItemModifierByIdError, Models.ItemModifier> {
  readonly _tag: "GetItemModifierById";
  readonly id: number;
}

export const GetItemModifierById = Request.tagged<GetItemModifierById>("GetItemModifierById");
