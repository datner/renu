import * as Models from "database";
import { Data, Request } from "effect";
import * as ModifierConfig from "../../modifier-config";

export class SetModifierConfigError extends Data.TaggedClass("SetModifierConfigError")<{}> {}

export interface SetModifierConfig extends Request.Request<SetModifierConfigError, Models.ItemModifier> {
  readonly _tag: "SetModifierConfig";
  readonly id: number;
  readonly config: ModifierConfig.Schema;
}

export const SetModifierConfig = Request.tagged<SetModifierConfig>("SetModifierConfig");
