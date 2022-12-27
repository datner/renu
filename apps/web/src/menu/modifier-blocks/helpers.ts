import * as O from "monocle-ts/Optional"
import * as L from "monocle-ts/Lens"
import { ModifierItem } from "src/menu/jotai/order"
import { constNull, pipe } from "fp-ts/function"
import { ReadonlyNonEmptyArray } from "fp-ts/ReadonlyNonEmptyArray"
import { findFirst } from "fp-ts/ReadonlyArray"
import { getOrElseW, getOrElse, chainNullableK } from "fp-ts/Option"
import { BaseOption, OptionContent } from "db/itemModifierConfig"
import { Locale } from "db"

export const lensOneOf = (ref: string) =>
  pipe(
    O.id<readonly ModifierItem[]>(),
    O.findFirst((m) => m.identifier === ref),
    O.prop("choice")
  )

export const lensChoiceAmount = (ref: string) => (choice: string) =>
  pipe(
    O.id<readonly ModifierItem[]>(),
    O.findFirst((m) => m.identifier === ref && m.choice === choice),
    O.prop("amount")
  )

interface WithContent {
  readonly content: ReadonlyNonEmptyArray<OptionContent>
}

export const getLabel =
  <C extends WithContent>(o: C) =>
  (locale: Locale) =>
    pipe(
      o.content,
      findFirst((c) => c.locale === locale),
      chainNullableK((c) => c.name),
      getOrElse(() => "unknown")
    )

export const getModifierPrice = pipe(L.id<BaseOption>(), L.prop("price"))

export const getDescription =
  <C extends WithContent>(o: C) =>
  (locale: Locale) =>
    pipe(
      o.content,
      findFirst((c) => c.locale === locale),
      chainNullableK((c) => c.description),
      getOrElseW(constNull)
    )
