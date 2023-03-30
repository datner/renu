import * as S from "@effect/schema/Schema";
import * as Item from "../item";
import * as Order from "./order";
import * as Common from "../schema/common";
import * as Number from "../schema/number";

export const Id = Common.Id('OrderItemId')
export type Id = S.To<typeof Id>

export const Schema = S.struct({
  id: Id,
  itemId: Item.Id,
  price: Number.Price,
  quantity: Number.Amount,
  comment: S.string,
  name: S.string,
  orderId: Order.Id
})


