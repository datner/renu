import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";
import * as ModifierConfig from "../../modifier-config"

export class SetModifierConfigError extends Data.TaggedClass("SetModifierConfigError")<{}> { }

export interface SetModifierConfig extends Request.Request<SetModifierConfigError, Models.ItemModifier> {
  readonly _tag: "SetModifierConfig";
  readonly id: number;
  readonly config: ModifierConfig.Schema;
}

export const SetModifierConfig = Request.tagged<SetModifierConfig>("SetModifierConfig");
