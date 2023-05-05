import * as Data from "@effect/data/Data";
import * as Option from "@effect/data/Option";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetItemByIdError extends Data.TaggedClass("GetItemByIdError")<{}> {}

export interface GetItemById extends Request.Request<GetItemByIdError, Models.Item> {
  readonly _tag: "GetItemById";
  readonly id: number;
  readonly venueId: Option.Option<number>;
}

export const GetItemById = Request.tagged<GetItemById>("GetItemById");
