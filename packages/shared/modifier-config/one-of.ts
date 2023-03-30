import * as S from "@effect/schema/Schema";
import { pipe } from "@effect/data/Function";
import * as Base from './base'

export const ModifierEnum = {
  oneOf: "oneOf",
  extras: "extras",
  Slider: "Slider",
} as const;

export const Option = pipe(
  Base.Option,
  S.extend(S.struct({ default: S.boolean })),
);
export interface Option extends S.To<typeof Option> {}

export const Modifier = pipe(
  Base.Modifier,
  S.omit("options"),
  S.extend(
    S.struct({
      _tag: S.literal('oneOf'),
      defaultOption: S.string,
      options: S.nonEmptyArray(Option),
    }),
  ),
);
export interface Modifier extends S.To<typeof Modifier> {}




