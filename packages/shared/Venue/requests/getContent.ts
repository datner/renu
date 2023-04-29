import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetVenueContentError extends Data.TaggedClass("GetVenueContentError")<{}> {}

export interface GetVenueContent extends Request.Request<GetVenueContentError, Models.RestaurantI18L[]> {
  readonly _tag: "GetVenueContent";
  readonly id: number;
}

export const GetVenueContent = Request.tagged<GetVenueContent>("GetVenueContent");
