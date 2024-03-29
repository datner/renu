import * as S from "@effect/schema/Schema";
import * as _Item from "../Item/item";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Order from "./order";

export const Id = Common.Id("OrderItemId");
export type Id = S.Schema.To<typeof Id>;

export class Item extends S.Class<Item>()({
  id: Id,
  itemId: _Item.Id,
  price: Number.Price,
  quantity: Number.Amount,
  comment: S.string,
  name: S.string,
  orderId: Order.Id,
}) {}

export const Schema = S.struct({
  id: Id,
  itemId: _Item.Id,
  price: Number.Price,
  quantity: Number.Amount,
  comment: S.string,
  name: S.string,
  orderId: Order.Id,
});
export interface Decoded extends S.Schema.To<typeof Schema> {}

export const getCost = (i: Decoded) => i.price * i.quantity;
