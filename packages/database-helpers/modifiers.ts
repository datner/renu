import * as S from "@effect/schema/Schema";
import * as O from "@effect/data/Option";
import * as P from "@effect/data/Predicate";
import * as N from "@effect/data/Number";
import { pipe } from "@effect/data/Function";
import { Content } from "./common";
import { Refinement } from "shared/effect";
import { Common, Number } from "shared/schema";

export const ModifierEnum = {
  oneOf: "oneOf",
  extras: "extras",
  Slider: "Slider",
} as const;

export const BaseOption = S.struct({
  managementRepresentation: S.optional(S.unknown),
  identifier: S.string,
  position: pipe(S.number, S.int()),
  price: S.number,
  content: S.nonEmptyArray(Content),
});
export interface BaseOption extends S.To<typeof BaseOption> {}

export const OneOfOption = pipe(
  BaseOption,
  S.extend(S.struct({ default: S.boolean })),
);
export interface OneOfOption extends S.To<typeof OneOfOption> {}

export const ExtrasOption = pipe(
  BaseOption,
  S.extend(S.struct({ multi: S.boolean })),
);
export interface ExtrasOption extends S.To<typeof ExtrasOption> {}

export const SliderOption = S.struct({
  managementRepresentation: S.optional(S.unknown),
  identifier: Common.Slug,
  position: Number.ArrayIndex,
  price: Number.Price,
  content: S.nonEmptyArray(Content),
});

export const BaseModifier = S.struct({
  identifier: S.string,
  content: S.nonEmptyArray(Content),
  options: S.nonEmptyArray(BaseOption),
});
export interface BaseModifier extends S.To<typeof BaseModifier> {}

export const OneOf = pipe(
  BaseModifier,
  S.omit("options"),
  S.extend(
    S.struct({
      _tag: S.literal(ModifierEnum.oneOf),
      defaultOption: S.string,
      options: S.nonEmptyArray(OneOfOption),
    }),
  ),
);
export interface OneOf extends S.To<typeof OneOf> {}

const Quantity = pipe(
  S.number,
  S.int(),
  S.nonNegative(),
  S.transform(
    S.optionFromSelf(S.number),
    O.liftPredicate(N.greaterThan(0)),
    O.getOrElse(() => 0),
  ),
);

export const Extras = pipe(
  BaseModifier,
  S.omit("options"),
  S.extend(
    S.struct({
      _tag: S.literal(ModifierEnum.extras),
      options: S.nonEmptyArray(ExtrasOption),
      min: Quantity,
      max: Quantity,
    }),
  ),
);
export interface Extras extends S.To<typeof Extras> {}

export const Slider = pipe(
  BaseModifier,
  S.omit("options"),
  S.extend(
    S.struct({
      _tag: S.literal(ModifierEnum.Slider),
      options: S.nonEmptyArray(SliderOption),
    }),
  ),
);
export interface Slider extends S.To<typeof Slider> {}

export const ModifierConfig = S.union(OneOf, Extras, Slider);
export type ModifierConfig = OneOf | Extras | Slider;

export const isOneOf: P.Refinement<ModifierConfig, OneOf> = Refinement.isTagged(
  "oneOf",
);
export const isExtras: P.Refinement<ModifierConfig, Extras> = Refinement
  .isTagged("extras");
export const isSlider: P.Refinement<ModifierConfig, Slider> = Refinement
  .isTagged("Slider");
