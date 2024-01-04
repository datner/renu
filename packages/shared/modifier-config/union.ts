import * as S from "@effect/schema/Schema";
import { Predicate } from "effect";
import { Refinement } from "../effect";
import * as Extras from "./extras";
import * as OneOf from "./one-of";
import * as Slider from "./slider";

export const ModifierEnum = {
  oneOf: "oneOf",
  extras: "extras",
  Slider: "Slider",
} as const;

export const Schema = S.union(OneOf.Modifier, Extras.Modifier, Slider.Modifier);
export type Schema = OneOf.OneOf | Extras.Extras | Slider.Slider;
export const FromPrisma = S.compose(S.unknown, Schema);
export const FromUnknown = FromPrisma;

export const isOneOf: Predicate.Refinement<Schema, OneOf.OneOf> = Refinement.isTagged(
  "oneOf",
);

export const isExtras: Predicate.Refinement<Schema, Extras.Extras> = Refinement
  .isTagged("extras");
