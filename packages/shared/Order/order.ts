import * as Brand from "@effect/data/Brand";
import * as Chunk from "@effect/data/Chunk";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as Str from "@effect/data/String";
import * as S from "@effect/schema/Schema";
import { Order as _Order, OrderItem, OrderState } from "database";
import { Effect } from "effect";
import { Number } from "../schema";
import * as Common from "../schema/common";
import * as Venue from "../Venue/venue";
import { ExtraSchema as ClearingExtraSchema } from "./clearing";
import * as internal from "./internal/service";
import { ExtraSchema as ManagementExtraSchema } from "./management";

export const Id = Common.Id("OrderId");
export type Id = S.To<typeof Id>;

export const _CUID = Brand.nominal<CUID>();
export const CUID = S.string.pipe(S.fromBrand(_CUID));
export type CUID = Brand.Branded<string, "OrderCUID">;

export const TxId = pipe(S.string, S.brand("TxId"));
export type TxId = S.To<typeof TxId>;

export const CustomerName = pipe(S.string, S.brand("CustomerName"));
export type CustomerName = S.To<typeof CustomerName>;

export class Order extends S.Class({
  id: Id,
  cuid: S.nullable(CUID),
  createdAt: S.DateFromSelf,
  updatedAt: S.DateFromSelf,
  venueId: Venue.Id,
  txId: S.optionFromNullable(TxId),
  customerName: pipe(
    CustomerName,
    S.transform(
      S.to(S.option(CustomerName)),
      O.liftPredicate(Str.isNonEmpty),
      (a) => CustomerName(O.getOrElse(a, () => Str.empty)),
    ),
  ),
  state: S.enums(OrderState),
  totalCost: Number.Cost,
  managementExtra: S.optionFromNullable(S.compose(S.unknown, ManagementExtraSchema)),
  clearingExtra: S.optionFromNullable(S.compose(S.unknown, ClearingExtraSchema)),
}) {
  setState(state: OrderState) {
    return Effect.flatMap(internal.tag, _ => _.setOrderState(this.id, state))
  }
}

export const Schema = S.struct({
  id: Id,
  cuid: S.nullable(CUID),
  createdAt: S.DateFromSelf,
  updatedAt: S.DateFromSelf,
  venueId: Venue.Id,
  txId: S.optionFromNullable(TxId),
  customerName: pipe(
    CustomerName,
    S.transform(
      S.to(S.option(CustomerName)),
      O.liftPredicate(Str.isNonEmpty),
      (a) => CustomerName(O.getOrElse(a, () => Str.empty)),
    ),
  ),
  state: S.enums(OrderState),
  totalCost: Number.Cost,
  managementExtra: pipe(ManagementExtraSchema, Common.fromPrisma, S.optionFromNullable),
  clearingExtra: pipe(ClearingExtraSchema, Common.fromPrisma, S.optionFromNullable),
});
export interface Decoded extends S.To<typeof Schema> {}

export const total = (o: _Order & { items: OrderItem[] }) =>
  pipe(
    Chunk.fromIterable(o.items),
    Chunk.reduce(0, (s, it) => s + it.price * it.quantity),
  );
