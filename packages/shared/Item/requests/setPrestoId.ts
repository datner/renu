import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class SetPrestoIdError extends Data.TaggedClass("SetPrestoIdError")<{}> {}

export interface SetPrestoId extends Request.Request<SetPrestoIdError, Models.Item> {
  readonly _tag: "SetPrestoId";
  readonly id: number;
  readonly prestoId: number;
}

export const SetPrestoId = Request.tagged<SetPrestoId>("SetPrestoId");
