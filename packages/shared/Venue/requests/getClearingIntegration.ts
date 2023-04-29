import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class GetVenueClearingIntegrationError extends Data.TaggedClass("GetVenueClearingIntegrationError")<{}> {}

export interface GetVenueClearingIntegration
  extends Request.Request<GetVenueClearingIntegrationError, Models.ClearingIntegration>
{
  readonly _tag: "GetVenueClearingIntegration";
  readonly id: number;
}

export const GetVenueClearingIntegration = Request.tagged<GetVenueClearingIntegration>("GetVenueClearingIntegration");
