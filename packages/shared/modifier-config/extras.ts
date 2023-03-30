import { pipe } from "@effect/data/Function";
import * as N from "@effect/data/Number";
import * as O from "@effect/data/Option";
import * as S from "@effect/schema/Schema";
import * as Base from "./base";

export const ModifierEnum = {
  oneOf: "oneOf",
  extras: "extras",
  Slider: "Slider",
} as const;

export const Quantity = pipe(
  S.number,
  S.int(),
  S.nonNegative(),
  S.transform(
    S.optionFromSelf(S.number),
    O.liftPredicate(N.greaterThan(0)),
    O.getOrElse(() => 0),
  ),
);

export const Option = pipe(
  Base.Option,
  S.extend(S.struct({ multi: S.boolean })),
);
export interface Option extends S.To<typeof Option> {}

export const Modifier = pipe(
  Base.Modifier,
  S.omit("options"),
  S.extend(
    S.struct({
      _tag: S.literal("extras"),
      options: S.nonEmptyArray(Option),
      min: Quantity,
      max: Quantity,
    }),
  ),
);
export interface Modifier extends S.To<typeof Modifier> {}
