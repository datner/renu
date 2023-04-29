import * as Schema from "@effect/schema/Schema";
import * as Common from "../schema/common";
import * as Category from './category'
import * as _ from '../Item/item'

export const Id = Common.Id("CategoryItemId");
export type Id = Schema.To<typeof Id>;

export const Item = Schema.struct({
  id: Id,
  position: Schema.number,
  categoryId: Category.Id,
  itemId: _.Id
});
export interface Item extends Schema.To<typeof Item> {}

