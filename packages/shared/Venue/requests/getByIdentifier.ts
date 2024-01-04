import * as Models from "database";
import { Data, Request } from "effect";

export class GetVenueByIdentifierError extends Data.TaggedClass("GetVenueByIdentifierError")<{}> {}

export interface GetVenueByIdentifier extends Request.Request<GetVenueByIdentifierError, Models.Venue> {
  readonly _tag: "GetVenueByIdentifier";
  readonly identifier: string;
}

export const GetVenueByIdentifier = Request.tagged<GetVenueByIdentifier>("GetVenueByIdentifier");
