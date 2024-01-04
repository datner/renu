import { pipe } from "effect";
import * as S from "@effect/schema/Schema";

export const Int = pipe(S.number, S.int(), S.brand("Int"));
export type Int = S.Schema.To<typeof Int>;

export const Positive = pipe(S.number, S.positive(), S.brand("Positive"));
export type Positive = S.Schema.To<typeof Positive>;

export const NonNegative = pipe(S.number, S.nonNegative(), S.brand("NonNegative"));
export type NonNegative = S.Schema.To<typeof NonNegative>;

export const PositiveInt = pipe(S.number, S.fromBrand(Int), S.fromBrand(Positive));
export type PositiveInt = S.Schema.To<typeof PositiveInt>;

export const NonNegativeInt = pipe(S.number, S.fromBrand(Int), S.fromBrand(NonNegative));
export type NonNegativeInt = S.Schema.To<typeof NonNegativeInt>;

export const Price = pipe(
  S.number,
  S.int(),
  S.nonNegative(),
  S.multipleOf(50),
  S.brand("Price"),
);
export type Price = S.Schema.To<typeof Price>;

export const Amount = pipe(S.number, S.int(), S.positive(), S.brand("Amount"));
export type Amount = S.Schema.To<typeof Amount>;

export const Multiple = pipe(Amount, S.greaterThan(1), S.brand("Multiple"));
export type Multiple = S.Schema.To<typeof Multiple>;

export const Cost = pipe(S.number, S.int(), S.nonNegative(), S.multipleOf(50), S.brand("Cost"));
export type Cost = S.Schema.To<typeof Cost>;

export const ArrayIndex = NonNegativeInt;
export type ArrayIndex = NonNegativeInt;
