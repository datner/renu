import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetVenueCategoriesError extends Data.TaggedClass("GetVenueCategoriesError")<{}> {}

export interface GetVenueCategories extends Request.Request<GetVenueCategoriesError, Models.Category[]> {
  readonly _tag: "GetVenueCategories";
  readonly id: number;
}

export const GetVenueCategories = Request.tagged<GetVenueCategories>("GetVenueCategories");
