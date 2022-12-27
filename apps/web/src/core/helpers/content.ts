import { Locale } from "db"
import { get } from "./common"
import { flow, pipe } from "fp-ts/function"
import * as O from "monocle-ts/Optional"
import { Nullish } from "src/menu/types/utils"
import { divide } from "./number"

interface ContentPartial {
  locale: Locale
  name: string
  description?: Nullish<string>
}

interface ContentfulPartial {
  content: readonly ContentPartial[]
}

export const contentOption = (prop: keyof ContentPartial, locale: Locale) =>
  pipe(
    O.id<ContentfulPartial | null>(),
    O.fromNullable,
    O.prop("content"),
    O.findFirst((it) => it.locale === locale),
    O.prop(prop),
    O.fromNullable
  ).getOption

export const shekel = Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  unitDisplay: "narrow",
})

export const priceOption = pipe(
  O.id<{ price: number } | null>(),
  O.fromNullable,
  O.prop("price")
).getOption

export const price = get(priceOption, 0)
export const toShekel = flow(divide(100), shekel.format)
export const priceShekel = flow(price, toShekel)
export const titleFor = (locale: Locale) => get(contentOption("name", locale), "")
export const descriptionFor = (locale: Locale) => get(contentOption("description", locale), "")

export const contentGet = (prop: keyof ContentPartial, locale: Locale) =>
  get(contentOption(prop, locale), "")
