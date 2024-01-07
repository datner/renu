import * as Models from "database";
import { Data, Request } from "effect";

export class GetVenueCategoriesError extends Data.TaggedClass("GetVenueCategoriesError")<{}> {}

export interface GetVenueCategories extends Request.Request<GetVenueCategoriesError, ReadonlyArray<any>> {
  readonly _tag: "GetVenueCategories";
  readonly id: number;
}

export const GetVenueCategories = Request.tagged<GetVenueCategories>("GetVenueCategories");
