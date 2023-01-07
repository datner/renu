import * as C from "@fp-ts/schema/Codec"
import { pipe } from "@fp-ts/data/Function"
import { Locale } from "@prisma/client"

export const ModifierEnum = {
  oneOf: "oneOf",
  extras: "extras",
} as const

export const OptionContent = C.struct({
  locale: C.enums(Locale),
  name: C.string,
  description: C.string,
})
export type OptionContent = C.Infer<typeof OptionContent>

export const BaseOption = C.struct({
  managementRepresentation: C.optional(C.json),
  identifier: C.string,
  position: pipe(C.number, C.int),
  price: C.number,
  content: C.nonEmptyArray(OptionContent),
})
export type BaseOption = C.Infer<typeof BaseOption>

export const OneOfOption = pipe(BaseOption, C.extend(C.struct({ default: C.boolean })))
export type OneOfOption = C.Infer<typeof OneOfOption>
export const ExtrasOption = pipe(BaseOption, C.extend(C.struct({ multi: C.boolean })))
export type ExtrasOption = C.Infer<typeof ExtrasOption>

export const BaseModifier = C.struct({
  identifier: C.string,
  content: C.nonEmptyArray(OptionContent),
  options: C.nonEmptyArray(BaseOption),
})
export type BaseModifier = C.Infer<typeof BaseModifier>

export const OneOf = pipe(
  BaseModifier,
  C.extend(
    C.struct({
      _tag: C.literal(ModifierEnum.oneOf),
      options: C.nonEmptyArray(OneOfOption),
    })
  )
)
export type OneOf = C.Infer<typeof OneOf>

export const Extras = pipe(
  BaseModifier,
  C.extend(
    C.struct({
      _tag: C.literal(ModifierEnum.extras),
      options: C.nonEmptyArray(ExtrasOption),
      min: pipe(C.number, C.int, C.greaterThanOrEqualTo(0), C.nullable),
      max: pipe(C.number, C.int, C.greaterThanOrEqualTo(0), C.nullable),
    })
  )
)
export type Extras = C.Infer<typeof Extras>

export const ModifierConfig = C.union(OneOf, Extras)
export type ModifierConfig = C.Infer<typeof ModifierConfig>
