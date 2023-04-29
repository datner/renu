import * as P from "@effect/data/Predicate";
import * as S from "@effect/schema/Schema";
import { Refinement } from "../effect";
import * as Extras from "./extras";
import * as OneOf from "./one-of";
import * as Slider from "./slider";
import { Prisma } from "database";
import { identity } from "@effect/data/Function";

export const ModifierEnum = {
  oneOf: "oneOf",
  extras: "extras",
  Slider: "Slider",
} as const;

export const Schema = S.union(OneOf.Modifier, Extras.Modifier, Slider.Modifier);
export type Schema = OneOf.OneOf | Extras.Extras | Slider.Slider;
export const FromPrisma = S.transform(S.json as S.Schema<Prisma.JsonValue, S.Json>, S.to(Schema), S.parse(Schema), S.validate(S.json))
export const FromUnknown = S.transform(S.unknown, S.to(Schema), S.parse(Schema), identity)

export const isOneOf: P.Refinement<Schema, OneOf.OneOf> = Refinement.isTagged(
  "oneOf",
);

export const isExtras: P.Refinement<Schema, Extras.Extras> = Refinement
  .isTagged("extras");
