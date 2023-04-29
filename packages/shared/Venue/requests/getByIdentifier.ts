import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetVenueByIdentifierError extends Data.TaggedClass("GetVenueByIdentifierError")<{}> {}

export interface GetVenueByIdentifier extends Request.Request<GetVenueByIdentifierError, Models.Venue> {
  readonly _tag: "GetVenueByIdentifier";
  readonly identifier: string;
}

export const GetVenueByIdentifier = Request.tagged<GetVenueByIdentifier>("GetVenueByIdentifier");
