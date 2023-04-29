import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetVenueByIdError extends Data.TaggedClass("GetVenueByIdError")<{}> {}

export interface GetVenueById extends Request.Request<GetVenueByIdError, Models.Venue> {
  readonly _tag: "GetVenueById";
  readonly id: number;
}

export const GetVenueById = Request.tagged<GetVenueById>("GetVenueById");
