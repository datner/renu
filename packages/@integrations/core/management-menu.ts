import * as S from "@effect/schema/Schema";
import { Option as O, pipe } from "effect";
import { Common, Number } from "shared/schema";

export const Name = pipe(
  S.string,
  S.brand("@integration/management/menu/Name"),
);
export type Name = S.Schema.To<typeof Name>;

export const ModifierOptionId = Common.ForeignId(
  "@integration/management/menu/ModifierOptionId",
);
export type ModifierOptionId = S.Schema.To<typeof ModifierOptionId>;

export const ModifierId = Common.ForeignId(
  "@integration/management/menu/ModifierId",
);
export type ModifierId = S.Schema.To<typeof ModifierId>;

export const ItemId = Common.ForeignId("@integration/management/menu/ItemId");
export type ItemId = S.Schema.To<typeof ItemId>;

export const CategoryId = Common.ForeignId(
  "@integration/management/menu/CategoryId",
);
export type CategoryId = S.Schema.To<typeof CategoryId>;

export const MenuId = Common.ForeignId("@integration/management/menu/MenuId");
export type MenuId = S.Schema.To<typeof MenuId>;

export interface Identified {
  id: O.Option<string>;
  name: string;
}

export const ModifierOption = pipe(
  S.struct({
    id: S.optional(ModifierOptionId, { as: "Option" }),
    price: S.optional(Number.Price, { as: "Option" }),
    name: Name,
  }),
);
export interface ModifierOption extends S.Schema.To<typeof ModifierOption> {}

export const Modifier = pipe(
  S.struct({
    id: S.optional(ModifierId, { as: "Option" }),
    min: S.optional(Number.Amount, { as: "Option" }),
    max: S.optional(Number.Amount, { as: "Option" }),
    name: Name,
    options: S.array(ModifierOption),
  }),
);
export interface Modifier extends S.Schema.To<typeof Modifier> {}

export const Item = pipe(
  S.struct({
    id: S.optional(ItemId, { as: "Option" }),
    name: Name,
    description: S.string,
    price: Number.Price,
    modifiers: S.array(Modifier),
  }),
);
export interface Item extends S.Schema.To<typeof Item> {}

export const Category = pipe(
  S.struct({
    id: S.optional(CategoryId, { as: "Option" }),
    name: Name,
    items: S.array(Item),
  }),
);
export interface Category extends S.Schema.To<typeof Category> {}

export const Menu = pipe(
  S.struct({
    id: S.optional(MenuId, { as: "Option" }),
    categories: S.array(Category),
  }),
);
export interface Menu extends S.Schema.To<typeof Menu> {}
