import * as Models from "database";
import { Data, Request } from "effect";

export class GetVenueByIdError extends Data.TaggedClass("GetVenueByIdError")<{}> {}

export interface GetVenueById extends Request.Request<GetVenueByIdError, Models.Venue> {
  readonly _tag: "GetVenueById";
  readonly id: number;
}

export const GetVenueById = Request.tagged<GetVenueById>("GetVenueById");
