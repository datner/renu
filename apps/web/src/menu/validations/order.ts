import { PAYMENT_TYPES } from "integrations/dorix/types"
import * as S from "@effect/schema/Schema"
import * as SC from "@effect/schema/data/Chunk"
import { pipe } from "@effect/data/Function"
import { Locale } from "database"
import { Common } from "src/core/schema"
import { Amount, Cost } from "../hooks/useOrder"
import * as _Menu from "../schema"

export const SendOrderOneOf = S.struct({
  _tag: S.literal("OneOf"),
  id: _Menu.ItemModifierId,
  choice: Common.Slug,
  amount: Amount,
})
export interface SendOrderOneOf extends S.Infer<typeof SendOrderOneOf> {}
export interface RawSendOrderOneOf {
  readonly _tag: "OneOf"
  readonly id: number
  readonly choice: string
  readonly amount: number
}

export const SendOrderExtras = S.struct({
  _tag: S.literal("Extras"),
  id: _Menu.ItemModifierId,
  choices: SC.fromValues(S.tuple(Common.Slug, Amount)),
})
export interface SendOrderExtras extends S.Infer<typeof SendOrderExtras> {}
export interface RawSendOrderExtras {
  readonly _tag: "Extras"
  readonly id: number
  readonly choices: readonly (readonly [string, number])[]
}

export const SendOrderModifiers = S.union(SendOrderOneOf, SendOrderExtras)
export type SendOrderModifiers = SendOrderOneOf | SendOrderExtras
export type RawSendOrderModifiers = RawSendOrderOneOf | RawSendOrderExtras

export const SendOrderItem = S.struct({
  item: _Menu.ItemId,
  amount: Amount,
  cost: Cost,
  comment: S.optional(S.string),
  modifiers: SC.fromValues(SendOrderModifiers),
})
export interface SendOrderItem extends S.Infer<typeof SendOrderItem> {}
export interface RawSendOrderItem {
  readonly item: number
  readonly amount: number
  readonly cost: number
  readonly comment?: string
  readonly modifiers: readonly RawSendOrderModifiers[]
}

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
  orderItems: SC.fromValues(SendOrderItem),
})
export interface RawSendOrder {
  readonly locale: Locale
  readonly venueIdentifier: string
  readonly orderItems: readonly RawSendOrderItem[]
}
export interface SendOrder extends S.Infer<typeof SendOrder> {}
