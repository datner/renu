import * as Models from "database";
import { Data, Request } from "effect";

export class GetItemsByVenueError extends Data.TaggedClass("GetItemsByVenueError")<{}> {}

export interface GetItemsByVenue extends Request.Request<GetItemsByVenueError, Models.Item[]> {
  readonly _tag: "GetItemsByVenue";
  readonly venueId: number;
  readonly orgId: number;
}

export const GetItemsByVenue = Request.tagged<GetItemsByVenue>("GetItemsByVenue");
