import * as Data from "@effect/data/Data";
import * as Option from "@effect/data/Option";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetItemByIdentifierError extends Data.TaggedClass("GetItemByIdentifierError")<{}> {}

export interface GetItemByIdentifier extends Request.Request<GetItemByIdentifierError, Models.Item> {
  readonly _tag: "GetItemByIdentifier";
  readonly identifier: string;
  readonly venueId: Option.Option<number>;
}

export const GetItemByIdentifier = Request.tagged<GetItemByIdentifier>("GetItemByIdentifier");

