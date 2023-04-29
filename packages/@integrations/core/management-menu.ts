import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as S from "@effect/schema/Schema";
import { Common, Number } from "shared/schema";

export const Name = pipe(
  S.string,
  S.brand("@integration/management/menu/Name"),
);
export type Name = S.To<typeof Name>;

export const ModifierOptionId = Common.ForeignId(
  "@integration/management/menu/ModifierOptionId",
);
export type ModifierOptionId = S.To<typeof ModifierOptionId>;

export const ModifierId = Common.ForeignId(
  "@integration/management/menu/ModifierId",
);
export type ModifierId = S.To<typeof ModifierId>;

export const ItemId = Common.ForeignId("@integration/management/menu/ItemId");
export type ItemId = S.To<typeof ItemId>;

export const CategoryId = Common.ForeignId(
  "@integration/management/menu/CategoryId",
);
export type CategoryId = S.To<typeof CategoryId>;

export const MenuId = Common.ForeignId("@integration/management/menu/MenuId");
export type MenuId = S.To<typeof MenuId>;

export interface Identified {
  id: O.Option<string>;
  name: string;
}

export const ModifierOption = pipe(
  S.struct({
    id: S.optional(ModifierOptionId).toOption(),
    price: S.optional(Number.Price).toOption(),
    name: Name,
  }),
);
export interface ModifierOption extends S.To<typeof ModifierOption> {}

export const Modifier = pipe(
  S.struct({
    id: S.optional(ModifierId).toOption(),
    min: S.optional(Number.Amount).toOption(),
    max: S.optional(Number.Amount).toOption(),
    name: Name,
    options: S.array(ModifierOption),
  }),
);
export interface Modifier extends S.To<typeof Modifier> {}

export const Item = pipe(
  S.struct({
    id: S.optional(ItemId).toOption(),
    name: Name,
    description: S.string,
    price: Number.Price,
    modifiers: S.array(Modifier),
  }),
);
export interface Item extends S.To<typeof Item> {}

export const Category = pipe(
  S.struct({
    id: S.optional(CategoryId).toOption(),
    name: Name,
    items: S.array(Item),
  }),
);
export interface Category extends S.To<typeof Category> {}

export const Menu = pipe(
  S.struct({
    id: S.optional(MenuId).toOption(),
    categories: S.array(Category),
  }),
);
export interface Menu extends S.To<typeof Menu> {}
