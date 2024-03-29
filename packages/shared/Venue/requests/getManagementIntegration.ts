import { Data, Request } from "effect";
import * as Models from "database";

export class GetVenueManagementIntegrationError extends Data.TaggedClass("GetVenueManagementIntegrationError")<{}> {}

export interface GetVenueManagementIntegration
  extends Request.Request<GetVenueManagementIntegrationError, Models.ManagementIntegration>
{
  readonly _tag: "GetVenueManagementIntegration";
  readonly id: number;
}

export const GetVenueManagementIntegration = Request.tagged<GetVenueManagementIntegration>(
  "GetVenueManagementIntegration",
);
