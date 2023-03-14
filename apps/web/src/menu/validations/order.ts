import { PAYMENT_TYPES } from "@integrations/dorix/types"
import * as S from "@effect/schema/Schema"
import { pipe } from "@effect/data/Function"
import { Locale } from "database"
import { Common, Number } from "shared/schema"
import * as _Menu from "../schema"

export const SendOrderOneOf = S.struct({
  _tag: S.literal("OneOf"),
  id: _Menu.ItemModifierId,
  choice: Common.Slug,
  amount: Number.Amount,
})
export interface SendOrderOneOf extends S.To<typeof SendOrderOneOf> {}

export const SendOrderExtras = S.struct({
  _tag: S.literal("Extras"),
  id: _Menu.ItemModifierId,
  choices: S.chunk(S.tuple(Common.Slug, Number.Amount)),
})
export interface SendOrderExtras extends S.To<typeof SendOrderExtras> {}

export const SendOrderModifiers = S.union(SendOrderOneOf, SendOrderExtras)
export type SendOrderModifiers = SendOrderOneOf | SendOrderExtras

export const SendOrderItem = S.struct({
  item: _Menu.ItemId,
  amount: Number.Amount,
  cost: Number.Cost,
  comment: S.optional(S.string),
  modifiers: S.chunk(SendOrderModifiers),
})
export interface SendOrderItem extends S.To<typeof SendOrderItem> {}

export const Transaction = S.struct({
  id: S.string,
  amount: S.number,
  type: S.enums(PAYMENT_TYPES),
})

export const UpdateManagement = S.struct({
  id: pipe(S.number, S.int(), S.greaterThan(0)),
  venueIdentifier: Common.Slug,
  phone: S.string,
  transaction: Transaction,
})

export const SendOrder = S.struct({
  locale: S.enums(Locale),
  venueIdentifier: Common.Slug,
  orderItems: S.chunk(SendOrderItem),
})
export interface SendOrder extends S.To<typeof SendOrder> {}
export interface EncodedSendOrder extends S.From<typeof SendOrder> {}
