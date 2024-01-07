import { ParseResult, Schema } from "@effect/schema";
import { Console, Effect, pipe, ReadonlyArray } from "effect";
import { inspect } from "util";
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

class _Item extends I.Item.extend<_Item>()({
  content: Schema.array(Common.Content),
}) {}

class Item extends _Item.transformFrom<Item>()(
  {
    modifiers: Schema.array(IM.fromPrisma),
  },
  (i) =>
    IR.getModifiers(i.id).pipe(
      Effect.mapBoth({
        onSuccess: (modifiers) => ({ ...i, modifiers }),
        onFailure: _ => ParseResult.parseError([ParseResult.missing]),
      }),
      accessing(Database),
    ),
  ParseResult.succeed,
) {}
// class Item extends I.Item.transformFrom<Item>()(
//   {
//     modifiers: Schema.array(IM.fromPrisma),
//     content: Schema.array(Common.Content),
//   },
//   (i) =>
//     Effect.all({
//       content: IR.getContent(i.id),
//       modifiers: IR.getModifiers(i.id),
//     }, { batching: true }).pipe(
//       Effect.mapBoth({
//         onSuccess: (_) => ({ ...i, ..._ }),
//         onFailure: _ => ParseResult.parseError([ParseResult.missing]),
//       }),
//       accessing(Database),
//     ),
//   ParseResult.succeed,
// ) {}

export class CategoryItem extends CI.Item.extend<CategoryItem>()({
  Item: Item,
}) {}
// export class CategoryItem extends CI.Item.transform<CategoryItem>()({
//   item: Item,
// }, ci =>
//   IR.getById(ci.itemId).pipe(
//     Effect.andThen(_ => Schema.decode(Item)(_)),
//     Effect.mapBoth({
//       onSuccess: (item) => ({ ...ci, item }),
//       onFailure: _ => _._tag === "GetItemByIdError" ? ParseResult.parseError([ParseResult.missing]) : _,
//     }),
//     accessing(Database),
//   ), ParseResult.succeed)
// {}

export class _Category extends C.Category.extend<_Category>()({
  content: Schema.array(Common.Content),
}) {}

export class Category extends _Category.transformFrom<Category>()(
  {
    categoryItems: Schema.to(Schema.array(CategoryItem)),
  },
  (c) =>
    CR.getItems(c.id).pipe(
      Effect.tap(Console.log),
      Effect.flatMap(Schema.decode(Schema.array(CategoryItem))),
      Effect.map((categoryItems) => ({ ...c, categoryItems })),
      Effect.mapError(_ => _._tag === "ParseError" ? _ : ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    ),
  ParseResult.succeed,
) {}

export class FromVenue extends V.Venue.transformFrom<FromVenue>()({
  content: Schema.array(pipe(Common.Content, Schema.omit("description"))),
  categories: Schema.to(Schema.array(Category)),
}, v =>
  Effect.zip(
    VR.getContent(v.id),
    VR.getCategories(v.id).pipe(
      Effect.andThen(Effect.forEach(_ => Schema.decode(Category)(_), { batching: true })),
      Effect.tap(_ => console.log(inspect(_, false, 4, true))),
      Effect.map(ReadonlyArray.filter(_ => ReadonlyArray.isNonEmptyReadonlyArray(_.categoryItems))),
    ),
    { batching: true },
  ).pipe(
    Effect.mapBoth({
      onSuccess: ([content, categories]) => ({ ...v, content, categories }),
      onFailure: _ => _._tag === "ParseError" ? _ : ParseResult.parseError([ParseResult.missing]),
    }),
    accessing(Database),
  ), ParseResult.succeed)
{}

export type MenuModifierItem = Schema.Schema.To<typeof IM.Modifier>;

export class MenuItem extends I.Item.extend<MenuItem>()({
  content: Schema.array(Common.Content),
  modifiers: Schema.array(IM.Modifier),
  updatedAt: Schema.Date,
  createdAt: Schema.Date,
}) {}

export class MenuCategoryItem extends CI.Item.extend<MenuCategoryItem>()({
  Item: MenuItem.struct,
}) {}

export class MenuCategory extends C.Category.extend<MenuCategory>()({
  content: Schema.array(Common.Content),
  categoryItems: Schema.array(MenuCategoryItem.struct),
  updatedAt: Schema.Date,
  createdAt: Schema.Date,
  deleted: Schema.optionFromNullable(Schema.Date),
}) {}
export class Menu extends V.Venue.extend<Menu>()({
  content: pipe(Common.Content, Schema.omit("description"), Schema.array),
  categories: Schema.array(MenuCategory.struct),
  updatedAt: Schema.Date,
  createdAt: Schema.Date,
}) {}
