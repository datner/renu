import * as Models from "database";
import { Data, Option, Request } from "effect";

export class GetItemByIdError extends Data.TaggedClass("GetItemByIdError")<{}> {}

export interface GetItemById extends Request.Request<GetItemByIdError, Models.Item> {
  readonly _tag: "GetItemById";
  readonly id: number;
  readonly venueId: Option.Option<number>;
}

export const GetItemById = Request.tagged<GetItemById>("GetItemById");
