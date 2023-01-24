import * as S from "@fp-ts/schema/Schema"
import { pipe } from "@fp-ts/data/Function"
import { Locale } from "@prisma/client"

export const ModifierEnum = {
  oneOf: "oneOf",
  extras: "extras",
} as const

export const OptionContent = S.struct({
  locale: S.enums(Locale),
  name: S.string,
  description: S.string,
})
export type OptionContent = S.Infer<typeof OptionContent>

export const BaseOption = S.struct({
  managementRepresentation: S.optional(S.json),
  identifier: S.string,
  position: pipe(S.number, S.int()),
  price: S.number,
  content: S.nonEmptyArray(OptionContent),
})
export type BaseOption = S.Infer<typeof BaseOption>

export const OneOfOption = pipe(BaseOption, S.extend(S.struct({ default: S.boolean })))
export type OneOfOption = S.Infer<typeof OneOfOption>
export const ExtrasOption = pipe(BaseOption, S.extend(S.struct({ multi: S.boolean })))
export type ExtrasOption = S.Infer<typeof ExtrasOption>

export const BaseModifier = S.struct({
  identifier: S.string,
  content: S.nonEmptyArray(OptionContent),
  options: S.nonEmptyArray(BaseOption),
})
export type BaseModifier = S.Infer<typeof BaseModifier>

export const OneOf = pipe(
  BaseModifier,
  S.extend(
    S.struct({
      _tag: S.literal(ModifierEnum.oneOf),
      options: S.nonEmptyArray(OneOfOption),
    })
  )
)
export type OneOf = S.Infer<typeof OneOf>

export const Extras = pipe(
  BaseModifier,
  S.extend(
    S.struct({
      _tag: S.literal(ModifierEnum.extras),
      options: S.nonEmptyArray(ExtrasOption),
      min: pipe(S.number, S.int(), S.greaterThanOrEqualTo(0), S.nullable),
      max: pipe(S.number, S.int(), S.greaterThanOrEqualTo(0), S.nullable),
    })
  )
)
export type Extras = S.Infer<typeof Extras>

export const ModifierConfig = S.union(OneOf, Extras)
export type ModifierConfig = S.Infer<typeof ModifierConfig>
