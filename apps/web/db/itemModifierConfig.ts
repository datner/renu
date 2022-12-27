import { Locale } from "@prisma/client"
import * as O from "fp-ts/Option"
import { isNonEmpty, filter } from "fp-ts/Array"
import * as A from "fp-ts/Array"
import { identity, pipe } from "fp-ts/function"
import { z } from "zod"
import { Json, zodIso } from "src/core/helpers/zod"
import { match } from "ts-pattern"

// export interface OptionContent {
//   readonly locale: Locale
//   readonly name: string
//   readonly description: string
// }

// export interface BaseOption {
//   readonly ref: string
//   readonly price: number
//   readonly content: ReadonlyNonEmptyArray<OptionContent>
//   readonly position: number
// }

// export interface OneOfOption extends BaseOption {
//   readonly default: boolean
// }

// export interface ExtrasOption extends BaseOption {
//   readonly multi: boolean
// }

// export interface BaseModifier {
//   readonly ref: string
//   readonly content: ReadonlyNonEmptyArray<OptionContent>
//   readonly options: NonEmptyArray<BaseOption>
// }

// export interface OneOf extends BaseModifier {
//   readonly _tag: "oneOf"
//   readonly options: NonEmptyArray<OneOfOption>
// }

// export interface Extras extends BaseModifier {
//   readonly _tag: "extras"
//   readonly options: NonEmptyArray<ExtrasOption>
//   readonly min: O.Option<number>
//   readonly max: O.Option<number>
// }

export const ModifierEnum = z.enum(["oneOf", "extras"])
export type ModifierEnum = z.infer<typeof ModifierEnum>

export const OptionContent = z.object({
  locale: z.nativeEnum(Locale),
  name: z.string(),
  description: z.string(),
})
export type OptionContent = z.infer<typeof OptionContent>

export const BaseOption = z.object({
  managementRepresentation: Json.optional(),
  identifier: z.string(),
  position: z.number().int(),
  price: z.number(),
  content: OptionContent.array().refine(isNonEmpty),
})
export type BaseOption = z.infer<typeof BaseOption>

export const OneOfOption = BaseOption.extend({ default: z.boolean() })
export const ExtrasOption = BaseOption.extend({ multi: z.boolean() })
export type OneOfOption = z.infer<typeof OneOfOption>
export type ExtrasOption = z.infer<typeof ExtrasOption>

export const BaseModifier = z.object({
  identifier: z.string(),
  content: OptionContent.array().refine(isNonEmpty),
  options: BaseOption.array().refine(isNonEmpty),
})
export type BaseModifier = z.infer<typeof BaseModifier>

const ensureOnlyOneDefault = (op: OneOfOption[]) =>
  pipe(
    op,
    filter((o) => o.default),
    A.size,
    (d) => d === 1
  )

export const OneOf = BaseModifier.extend({
  _tag: z.literal(ModifierEnum.enum.oneOf),
  options: OneOfOption.array().refine(isNonEmpty),
})
export type OneOf = z.infer<typeof OneOf>

export const Extras = BaseModifier.extend({
  _tag: z.literal(ModifierEnum.enum.extras),
  options: ExtrasOption.array().refine(isNonEmpty),
  min: z
    .number()
    .nullable()
    .transform(O.fromNullable)
    .transform(O.chain((n) => (n > 0 ? O.some(n) : O.none))),
  max: z
    .number()
    .nullable()
    .transform(O.fromNullable)
    .transform(O.chain((n) => (n > 0 ? O.some(n) : O.none))),
})
export type Extras = z.infer<typeof Extras>

export const ModifierConfig = zodIso(z.discriminatedUnion("_tag", [OneOf, Extras]), (mod) =>
  match(mod)
    .with({ _tag: "extras" }, ({ min, max, ...ex }) => ({
      ...ex,
      min: O.toNullable(min),
      max: O.toNullable(max),
    }))
    .with({ _tag: "oneOf" }, identity)
    .exhaustive()
)

export type ModifierConfig = z.infer<typeof ModifierConfig>

export interface Modifier {
  readonly config: OneOf | Extras
  readonly position: number
  readonly id: number
}
