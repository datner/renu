import * as S from "@effect/schema/Schema"
import * as P from "@effect/data/Predicate"
import { pipe } from "@effect/data/Function"
import { Locale } from "database"
import { Common } from "src/core/schema"
import { Modifiers } from "database-helpers"

export const ItemModifierId = Common.Id("ItemModifierId")
export type ItemModifierId = S.Infer<typeof ItemModifierId>
export const ItemId = Common.Id("ItemId")
export type ItemId = S.Infer<typeof ItemId>
export const CategoryId = Common.Id("CategoryId")
export type CategoryId = S.Infer<typeof CategoryId>

export const ItemModifier = S.struct({
  id: ItemModifierId,
  position: S.number,
  config: Modifiers.ModifierConfig,
})
export interface ItemModifier<Config = Modifiers.ModifierConfig> {
  readonly id: ItemModifierId
  readonly position: number
  readonly config: Config
}

export const isItemOneOf: P.Refinement<ItemModifier, ItemModifier<Modifiers.OneOf>> = (
  im
): im is ItemModifier<Modifiers.OneOf> => Modifiers.isOneOf(im.config)

export const isItemExtras: P.Refinement<ItemModifier, ItemModifier<Modifiers.Extras>> = (
  im
): im is ItemModifier<Modifiers.Extras> => Modifiers.isExtras(im.config)

export const Content = S.struct({
  locale: S.enums(Locale),
  name: S.string,
  description: S.nullable(S.string),
})
export interface Content extends S.Infer<typeof Content> {}

export const Item = S.struct({
  id: ItemId,
  image: S.nullable(S.string),
  price: S.number,
  identifier: S.string,
  blurDataUrl: S.nullable(S.string),
  blurHash: S.nullable(S.string),
  categoryId: CategoryId,
  content: S.array(Content),
  modifiers: S.array(ItemModifier),
})
export interface Item extends S.Infer<typeof Item> {}

export const CategoryItem = S.struct({
  position: S.number,
  Item,
})
export interface CategoryItem extends S.Infer<typeof CategoryItem> {}

export const Category = S.struct({
  id: CategoryId,
  identifier: S.string,
  content: S.array(Content),
  categoryItems: S.array(CategoryItem),
})
export interface Category extends S.Infer<typeof Category> {}

export const FullMenu = S.struct({
  open: S.boolean,
  simpleContactInfo: S.string,
  content: pipe(Content, S.omit("description"), S.array),
  categories: S.array(Category),
})
export interface FullMenu extends S.Infer<typeof FullMenu> {}
