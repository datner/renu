import * as S from "@effect/schema/Schema"
import { pipe } from "@effect/data/Function"
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
export interface OptionContent extends S.Infer<typeof OptionContent> {}

export const BaseOption = S.struct({
  managementRepresentation: S.optional(S.unknown),
  identifier: S.string,
  position: pipe(S.number, S.int()),
  price: S.number,
  content: S.nonEmptyArray(OptionContent),
})
export interface BaseOption extends S.Infer<typeof BaseOption> {}

export const OneOfOption = pipe(BaseOption, S.extend(S.struct({ default: S.boolean })))
export interface OneOfOption extends S.Infer<typeof OneOfOption> {}

export const ExtrasOption = pipe(BaseOption, S.extend(S.struct({ multi: S.boolean })))
export interface ExtrasOption extends S.Infer<typeof ExtrasOption> {}

export const BaseModifier = S.struct({
  identifier: S.string,
  content: S.nonEmptyArray(OptionContent),
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

export const Extras = pipe(
  BaseModifier,
  S.omit("options"),
  S.extend(
    S.struct({
      _tag: S.literal(ModifierEnum.extras),
      options: S.nonEmptyArray(ExtrasOption),
      min: pipe(S.number, S.int(), S.greaterThanOrEqualTo(0), S.nullable),
      max: pipe(S.number, S.int(), S.greaterThanOrEqualTo(0), S.nullable),
    })
  )
)
export interface Extras extends S.Infer<typeof Extras> {}

export const ModifierConfig = S.union(OneOf, Extras)
export type ModifierConfig = OneOf | Extras
