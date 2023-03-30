import * as Chunk from "@effect/data/Chunk"
import { pipe } from "@effect/data/Function"
import { Order, OrderItem, OrderState  } from "database"
import * as O from "@effect/data/Option";
import * as Str from "@effect/data/String";
import * as S from "@effect/schema/Schema";
import * as Venue from "../venue";
import * as Common from "../schema/common";

export const Id = Common.Id('OrderId')
export type Id = S.To<typeof Id>;

export const TxId = pipe(S.string, S.brand("TxId"));
export type TxId = S.To<typeof TxId>;

export const CustomerName = pipe(S.string, S.brand("CustomerName"));
export type CustomerName = S.To<typeof CustomerName>;

export const Schema = S.struct({
  id: Id,
  createdAt: S.date,
  updatedAt: S.date,
  venueId: Venue.Id,
  txId: S.optionFromNullable(TxId),
  customerName: pipe(
    CustomerName,
    S.transform(
      S.optionFromSelf(CustomerName),
      O.liftPredicate(Str.isEmpty),
      (a) => CustomerName(O.getOrElse(a, () => Str.empty)),
    ),
  ),
  state: S.enums(OrderState),
});
export interface Decoded extends S.To<typeof Schema> {}


export const total = (o: Order & { items: OrderItem[] }) =>
  pipe(
    Chunk.fromIterable(o.items),
    Chunk.reduce(0, (s, it) => s + it.price * it.quantity)
  )

