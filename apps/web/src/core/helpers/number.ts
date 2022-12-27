import * as O from "fp-ts/Ord"
import { fromPredicate, Option } from "fp-ts/Option"
import * as N from "fp-ts/number"
import * as M from "fp-ts/Monoid"
import * as P from "fp-ts/Predicate"
import { pipe } from "fp-ts/function"
import { Endomorphism } from "fp-ts/Endomorphism"

export const clamp = O.clamp(N.Ord)

export const min = (first: number) => (second: number) => O.min(N.Ord)(first, second)
export const max = (first: number) => (second: number) => O.max(N.Ord)(first, second)
export const add = (first: number) => (second: number) => N.MonoidSum.concat(first, second)

export const sum = M.concatAll(N.MonoidSum)

export const divide =
  (divisor: number): Endomorphism<number> =>
  (dividend: number) =>
    dividend / divisor

export const multiply =
  (by: number): Endomorphism<number> =>
  (value: number) =>
    value * by

export const isValid = P.not(Number.isNaN)

export const fromStringWithRadix =
  (radix: number) =>
  (str: string): Option<number> =>
    pipe(Number.parseInt(str, radix), fromPredicate(isValid))

export const fromString = fromStringWithRadix(10)
