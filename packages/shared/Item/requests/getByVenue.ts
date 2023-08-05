import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetItemsByVenueError extends Data.TaggedClass("GetItemsByVenueError")<{}> {}

export interface GetItemsByVenue extends Request.Request<GetItemsByVenueError, Models.Item[]> {
  readonly _tag: "GetItemsByVenue";
  readonly venueId: number;
  readonly orgId: number;
}

export const GetItemsByVenue = Request.tagged<GetItemsByVenue>("GetItemsByVenue");
