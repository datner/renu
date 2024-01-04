import * as Models from "database";
import { Data, Request } from "effect";

export class GetVenueContentError extends Data.TaggedClass("GetVenueContentError")<{}> {}

export interface GetVenueContent extends Request.Request<GetVenueContentError, ReadonlyArray<Models.RestaurantI18L>> {
  readonly _tag: "GetVenueContent";
  readonly id: number;
}

export const GetVenueContent = Request.tagged<GetVenueContent>("GetVenueContent");
