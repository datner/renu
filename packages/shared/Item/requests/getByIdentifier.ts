import * as Models from "database";
import { Data, Option, Request } from "effect";

export class GetItemByIdentifierError extends Data.TaggedClass("GetItemByIdentifierError")<{}> {}

export interface GetItemByIdentifier extends Request.Request<GetItemByIdentifierError, Models.Item> {
  readonly _tag: "GetItemByIdentifier";
  readonly identifier: string;
  readonly venueId: Option.Option<number>;
}

export const GetItemByIdentifier = Request.tagged<GetItemByIdentifier>("GetItemByIdentifier");
