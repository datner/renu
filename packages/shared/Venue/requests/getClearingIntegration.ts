import * as Models from "database";
import { Data, Option, Request } from "effect";

export class GetVenueClearingIntegrationError extends Data.TaggedClass("GetVenueClearingIntegrationError")<{}> {}

export interface GetVenueClearingIntegration
  extends Request.Request<GetVenueClearingIntegrationError, Option.Option<Models.ClearingIntegration>>
{
  readonly _tag: "GetVenueClearingIntegration";
  readonly id: number;
}

export const GetVenueClearingIntegration = Request.tagged<GetVenueClearingIntegration>("GetVenueClearingIntegration");
