import * as S from "@effect/schema/Schema";
import * as Item from "../Item/item";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Order from "./order";

export const Id = Common.Id("OrderItemId");
export type Id = S.To<typeof Id>;

export const Schema = S.struct({
  id: Id,
  itemId: Item.Id,
  price: Number.Price,
  quantity: Number.Amount,
  comment: S.string,
  name: S.string,
  orderId: Order.Id,
});
export interface Decoded extends S.To<typeof Schema> {}

export const getCost = (i: Decoded) => i.price * i.quantity
