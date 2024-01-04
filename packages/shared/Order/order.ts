import * as S from "@effect/schema/Schema";
import { Order as _Order, OrderItem, OrderState } from "database";
import { Brand, Chunk, Effect, Option, pipe, String } from "effect";
import { Number } from "../schema";
import * as Common from "../schema/common";
import * as Venue from "../Venue/venue";
import { ExtraSchema as ClearingExtraSchema } from "./clearing";
import * as internal from "./internal/service";
import { ExtraSchema as ManagementExtraSchema } from "./management";

export const Id = Common.Id("OrderId");
export type Id = S.Schema.To<typeof Id>;

export const _CUID = Brand.nominal<CUID>();
export const CUID = S.string.pipe(S.fromBrand(_CUID));
export type CUID = Brand.Branded<string, "OrderCUID">;

export const TxId = pipe(S.string, S.brand("TxId"));
export type TxId = S.Schema.To<typeof TxId>;

export const CustomerName = pipe(S.string, S.brand("CustomerName"));
export type CustomerName = S.Schema.To<typeof CustomerName>;

export class Order extends S.Class<Order>()({
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
      Option.liftPredicate(String.isNonEmpty),
      (a) => CustomerName(Option.getOrElse(a, () => String.empty)),
    ),
  ),
  state: S.enums(OrderState),
  totalCost: Number.Cost,
  managementExtra: S.optionFromNullable(S.compose(S.unknown, ManagementExtraSchema)),
  clearingExtra: S.optionFromNullable(S.compose(S.unknown, ClearingExtraSchema)),
}) {
  setState(state: OrderState) {
    return Effect.flatMap(internal.tag, _ => _.setOrderState(this.id, state));
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
      Option.liftPredicate(String.isNonEmpty),
      (a) => CustomerName(Option.getOrElse(a, () => String.empty)),
    ),
  ),
  state: S.enums(OrderState),
  totalCost: Number.Cost,
  managementExtra: pipe(ManagementExtraSchema, Common.fromPrisma, S.optionFromNullable),
  clearingExtra: pipe(ClearingExtraSchema, Common.fromPrisma, S.optionFromNullable),
});
export interface Decoded extends S.Schema.To<typeof Schema> {}

export const total = (o: _Order & { items: OrderItem[] }) =>
  pipe(
    Chunk.fromIterable(o.items),
    Chunk.reduce(0, (s, it) => s + it.price * it.quantity),
  );
