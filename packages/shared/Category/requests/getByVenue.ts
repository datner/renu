import * as Models from "database";
import { Data, Request } from "effect";

export class GetCategoryByVenueError extends Data.TaggedClass("GetCategoryByVenueError")<{}> {}

export interface GetCategoryByVenue extends Request.Request<GetCategoryByVenueError, Models.Category[]> {
  readonly _tag: "GetCategoryByVenue";
  readonly id: number;
}

export const GetCategoryByVenue = Request.tagged<GetCategoryByVenue>("GetCategoryByVenue");
