import { pipe } from "@effect/data/Function";
import * as S from "@effect/schema/Schema";
import { Number, Option as O } from "effect";
import * as Base from "./base";

export const Quantity = pipe(
  S.number,
  S.int(),
  S.nonNegative(),
  S.transform(
    S.optionFromSelf(S.number),
    O.liftPredicate(Number.greaterThan(0)),
    O.getOrElse(() => 0),
  ),
);

export const Option = pipe(
  Base.Option,
  S.extend(S.struct({ multi: S.boolean })),
);
export interface Option extends S.Schema.To<typeof Option> {}

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
export interface Extras extends S.Schema.To<typeof Modifier> {}
