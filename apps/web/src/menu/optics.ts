import { dual } from "@effect/data/Function"
import * as Optic from "@fp-ts/optic"
import * as _Menu from "./schema"
import { Locale } from "database"
import { Modifiers } from "database-helpers"

const _menu = Optic.id<_Menu.FullMenu>()

export const _item: {
  (categoryId: number): (itemId: number) => Optic.Optional<_Menu.FullMenu, _Menu.Item>
  (itemId: number, categoryId: number): Optic.Optional<_Menu.FullMenu, _Menu.Item>
} = dual(2, (itemId: number, categoryId: number) =>
  _menu
    .at("categories")
    .compose(Optic.findFirst((c) => c.id === categoryId))
    .at("categoryItems")
    .compose(Optic.findFirst((ci) => ci.Item.id === itemId))
    .at("Item")
)

export const _itemPriceOf: {
  (categoryId: number): (itemId: number) => Optic.Optional<_Menu.FullMenu, number>
  (itemId: number, categoryId: number): Optic.Optional<_Menu.FullMenu, number>
} = dual(2, (itemId: number, categoryId: number) => _item(itemId, categoryId).at("price"))

export interface ParsedItem {
  readonly image: string
  readonly price: number
  readonly id: number
  readonly identifier: string
  readonly blurDataUrl: string | null
  readonly blurHash: string | null
  readonly content: readonly {
    readonly locale: Locale
    readonly name: string
    readonly description: string
  }[]
  readonly categoryId: number
  readonly modifiers: readonly {
    position: number
    id: number
    config: Modifiers.ModifierConfig
  }[]
}
