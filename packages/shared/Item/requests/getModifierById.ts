import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetItemModifierByIdError extends Data.TaggedClass("GetItemModifierByIdError")<{}> {}

export interface GetItemModifierById extends Request.Request<GetItemModifierByIdError, Models.ItemModifier> {
  readonly _tag: "GetItemModifierById";
  readonly id: number;
}

export const GetItemModifierById = Request.tagged<GetItemModifierById>("GetItemModifierById");
