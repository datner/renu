import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as ParseResult from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";
import * as C from "../Category/category";
import * as CI from "../Category/item";
import * as CR from "../Category/requests";
import { Database } from "../Database/service";
import { accessing } from "../effect/Context";
import * as I from "../Item/item";
import * as IM from "../Item/modifier";
import * as IR from "../Item/requests";
import { Common } from "../schema";
import * as VR from "./requests";
import * as V from "./venue";

const ItemExtension = Schema.struct({
  modifiers: Schema.array(IM.fromPrisma),
  content: Schema.array(Common.Content),
});

const Item = Schema.transformResult(
  Schema.from(I.Item),
  Schema.extend(ItemExtension)(I.Item),
  (i) =>
    pipe(
      Effect.allPar(
        IR.getContent(i.id),
        IR.getModifiers(i.id),
      ),
      Effect.map(([content, modifiers]) => ({ ...i, content, modifiers })),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    ),
  ParseResult.success,
);

export interface Item extends Schema.To<typeof Item> {}

const CategoryItemExtension = Schema.struct({
  item: Item,
});

export const CategoryItem = Schema.extend(CategoryItemExtension)(CI.Item);
export interface CategoryItem extends Schema.To<typeof CategoryItem> {}

export const CategoryItems = Schema.transformResult(
  Schema.from(Schema.array(CI.Item)),
  Schema.array(CategoryItem),
  Effect.forEachPar(ci =>
    pipe(
      IR.getById(ci.itemId),
      Effect.map((item) => ({ ...ci, item })),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    )
  ),
  ParseResult.success,
);
export interface CategoryItems extends Schema.To<typeof CategoryItems> {}

const CategoryExtension = Schema.struct({
  content: Schema.array(Common.Content),
  categoryItems: CategoryItems,
});

export interface Category extends Schema.To<typeof Category> {}

const Category = Schema.transformResult(
  Schema.from(C.Category),
  Schema.extend(CategoryExtension)(C.Category),
  (c) =>
    pipe(
      Effect.allPar(
        CR.getContent(c.id),
        CR.getItems(c.id),
      ),
      Effect.map(([content, categoryItems]) => ({ ...c, content, categoryItems })),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    ),
  ParseResult.success,
);

const VenueExtension = Schema.struct({
  content: Schema.array(Common.Content),
  categories: Schema.array(Category),
});

export const fromVenue = Schema.transformResult(
  Schema.from(V.Venue),
  Schema.extend(VenueExtension)(V.Venue),
  v =>
    pipe(
      Effect.allPar(
        VR.getContent(v.id),
        VR.getCategories(v.id),
      ),
      Effect.map(([content, categories]) => ({ ...v, content, categories })),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    ),
  ParseResult.success,
);

export const MenuModifierItem = pipe(
  IM.Modifier,
  Schema.pick("id", "position", "config"),
);
export interface MenuModifierItem extends Schema.To<typeof MenuModifierItem> {}

export const MenuItem = pipe(
  I.Item,
  Schema.pick(
    "id",
    "image",
    "price",
    "identifier",
    "blurDataUrl",
    "blurHash",
    "categoryId",
  ),
  Schema.extend(Schema.struct({
    content: Schema.array(Common.Content),
    modifiers: pipe(
      MenuModifierItem,
      Schema.array,
    ),
  })),
);
export interface MenuItem extends Schema.To<typeof MenuItem> {}

export const MenuCategoryItem = pipe(
  CI.Item,
  Schema.pick("position"),
  Schema.extend(Schema.struct({
    item: pipe(
      MenuItem,
    ),
  })),
);
export interface MenuCategoryItem extends Schema.To<typeof MenuCategoryItem> {}

export const MenuCategory = pipe(
  C.Category,
  Schema.pick("id", "identifier"),
  Schema.extend(Schema.struct({
    content: Schema.array(Common.Content),
    categoryItems: pipe(
      MenuCategoryItem,
      Schema.array,
    ),
  })),
);
export interface MenuCategory extends Schema.To<typeof MenuCategory> {}

export const Menu = pipe(
  V.Venue,
  Schema.pick("id", "open", "simpleContactInfo"),
  Schema.extend(Schema.struct({
    content: Schema.array(Common.Content),
    categories: pipe(
      MenuCategory,
      Schema.array,
    ),
  })),
);
export interface Menu extends Schema.To<typeof Menu> {}
