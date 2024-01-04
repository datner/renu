import * as Models from "database";
import { Data, Request } from "effect";

export class SetPrestoIdError extends Data.TaggedClass("SetPrestoIdError")<{}> {}

export interface SetPrestoId extends Request.Request<SetPrestoIdError, Models.Item> {
  readonly _tag: "SetPrestoId";
  readonly id: number;
  readonly prestoId: number;
}

export const SetPrestoId = Request.tagged<SetPrestoId>("SetPrestoId");
