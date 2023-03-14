import * as S from "@effect/schema/Schema"
import * as O from "@effect/data/Option"
import * as P from "@effect/data/Predicate"
import * as N from "@effect/data/Number"
import { pipe } from "@effect/data/Function"
import { Content } from "./common"
import { Refinement } from "shared/effect"

export const ModifierEnum = {
  oneOf: "oneOf",
  extras: "extras",
} as const

export const BaseOption = S.struct({
  managementRepresentation: S.optional(S.unknown),
  identifier: S.string,
  position: pipe(S.number, S.int()),
  price: S.number,
  content: S.nonEmptyArray(Content),
})
export interface BaseOption extends S.Infer<typeof BaseOption> {}

export const OneOfOption = pipe(BaseOption, S.extend(S.struct({ default: S.boolean })))
export interface OneOfOption extends S.Infer<typeof OneOfOption> {}

export const ExtrasOption = pipe(BaseOption, S.extend(S.struct({ multi: S.boolean })))
export interface ExtrasOption extends S.Infer<typeof ExtrasOption> {}

export const BaseModifier = S.struct({
  identifier: S.string,
  content: S.nonEmptyArray(Content),
  options: S.nonEmptyArray(BaseOption),
})
export interface BaseModifier extends S.Infer<typeof BaseModifier> {}

export const OneOf = pipe(
  BaseModifier,
  S.omit("options"),
  S.extend(
    S.struct({
      _tag: S.literal(ModifierEnum.oneOf),
      defaultOption: S.string,
      options: S.nonEmptyArray(OneOfOption),
    })
  )
)
export interface OneOf extends S.Infer<typeof OneOf> {}

const Quantity = pipe(
  S.number,
  S.int(),
  S.nonNegative(),
  S.transform(
    S.option(S.number),
    O.liftPredicate(N.greaterThan(0)),
    O.getOrElse(() => 0)
  )
)

export const Extras = pipe(
  BaseModifier,
  S.omit("options"),
  S.extend(
    S.struct({
      _tag: S.literal(ModifierEnum.extras),
      options: S.nonEmptyArray(ExtrasOption),
      min: Quantity,
      max: Quantity,
    })
  )
)
export interface Extras extends S.Infer<typeof Extras> {}

export const ModifierConfig = S.union(OneOf, Extras)
export type ModifierConfig = OneOf | Extras

export const isOneOf: P.Refinement<ModifierConfig, OneOf> = Refinement.isTagged("oneOf")
export const isExtras: P.Refinement<ModifierConfig, Extras> = Refinement.isTagged("extras")
