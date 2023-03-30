import * as S from "@effect/schema/Schema";
import * as P from "@effect/data/Predicate";
import { Refinement } from "../effect";
import * as OneOf from './one-of'
import * as Extras from './extras'
import * as Slider from './slider'
// import { pipe } from "@effect/data/Function";
// import { Common } from "../schema";

export const ModifierEnum = {
  oneOf: "oneOf",
  extras: "extras",
  Slider: "Slider",
} as const;


export const Schema = S.union(OneOf.Modifier, Extras.Modifier, Slider.Modifier);
export type Schema = OneOf.Modifier | Extras.Modifier | Slider.Modifier;

// export const fromConfig = Common.fromJson(Schema)

export const isOneOf: P.Refinement<Schema, OneOf.Modifier> = Refinement.isTagged(
  "oneOf",
);

export const isExtras: P.Refinement<Schema, Extras.Modifier> = Refinement
  .isTagged("extras");
