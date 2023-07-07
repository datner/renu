import * as P from "@effect/data/Predicate";
import * as ParseResult from "@effect/schema/ParseResult";
import * as S from "@effect/schema/Schema";
import { Prisma } from "database";
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
export const FromPrisma = S.transformResult(
  S.json as S.Schema<Prisma.JsonValue, S.Json>,
  S.to(Schema),
  S.parse(Schema),
  S.validate(S.json),
);
export const FromUnknown = S.transformResult(S.unknown, S.to(Schema), S.parse(Schema), ParseResult.success);

export const isOneOf: P.Refinement<Schema, OneOf.OneOf> = Refinement.isTagged(
  "oneOf",
);

export const isExtras: P.Refinement<Schema, Extras.Extras> = Refinement
  .isTagged("extras");
