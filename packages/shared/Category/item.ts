import * as Schema from "@effect/schema/Schema";
import * as _ from "../Item/item";
import * as Common from "../schema/common";
import * as Category from "./category";

export const Id = Common.Id("CategoryItemId");
export type Id = Schema.Schema.To<typeof Id>;

export class Item extends Schema.Class<Item>()({
  id: Id,
  position: Schema.number,
  categoryId: Category.Id,
  itemId: _.Id,
}) {}
