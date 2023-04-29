import * as S from "@effect/schema/Schema";
import * as ItemModifier from "../Item/modifier";
import * as Common from "../schema/common";
import * as Number from "../schema/number";

export const Id = Common.Id("OrderItemModifierId");
export type Id = S.To<typeof Id>;

export const Schema = S.struct({
  id: Id,
  itemModifierId: ItemModifier.Id,
  choice: Common.Slug,
  ref: Common.Slug,
  amount: Number.Amount,
  price: Number.Price,
});
export interface Decoded extends S.To<typeof Schema> {}

export const getCost = (i: Decoded) => i.price * i.amount
