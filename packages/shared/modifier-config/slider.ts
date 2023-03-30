import { pipe } from "@effect/data/Function";
import * as S from "@effect/schema/Schema";
import * as Base from "./base";

export const ModifierEnum = {
  oneOf: "oneOf",
  extras: "extras",
  Slider: "Slider",
} as const;

export const Option = pipe(
  Base.Option,
);
export interface Option extends S.To<typeof Option> {}

export const Modifier = pipe(
  Base.Modifier,
  S.omit("options"),
  S.extend(
    S.struct({
      _tag: S.literal("Slider"),
      options: S.nonEmptyArray(Option),
    }),
  ),
);
export interface Modifier extends S.To<typeof Modifier> {}
