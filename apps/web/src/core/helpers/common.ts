import { constant, flow } from "fp-ts/function"
import * as O from "fp-ts/Option"

export const get = <T, V>(option: (as: T) => O.Option<V>, fallback: V) =>
  flow(
    option,
    O.getOrElse(() => fallback)
  )

export function isExists<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null
}

export type AbsurdError = {
  tag: "absurdError"
}

export const constAbsurdError = constant<AbsurdError>({ tag: "absurdError" })
