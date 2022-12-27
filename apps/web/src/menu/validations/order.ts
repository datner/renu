import { Slug } from "src/auth/validations"
import { Id } from "src/core/helpers/zod"
import { zLocale } from "src/core/hooks/useLocale"
import { ModifierEnum } from "db/itemModifierConfig"
import * as Dorix from "integrations/dorix/types"
import { PAYMENT_TYPES } from "integrations/dorix/types"
import { z } from "zod"

export const OrderModifierItem = z.object({
  id: Id,
  identifier: z.string(),
  price: z.number().int().nonnegative().multipleOf(50),
  _tag: ModifierEnum,
  choice: z.string(),
  amount: z.number().int().nonnegative(),
})

export const SendOrderItem = z.object({
  amount: z.number().int().positive(),
  price: z.number().int().positive().multipleOf(50),
  comment: z.string().default(""),
  item: Id,
  name: z.string(),
  modifiers: OrderModifierItem.array(),
})

export type SendOrderItem = z.infer<typeof SendOrderItem>

export const Transaction: z.ZodType<Dorix.Transaction> = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.nativeEnum(PAYMENT_TYPES),
})

export const UpdateManagement = z.object({
  orderId: Id,
  venueIdentifier: Slug,
  phone: z.string(),
  transaction: Transaction,
})

export const SendOrder = z.object({
  locale: zLocale,
  venueIdentifier: Slug,
  orderItems: SendOrderItem.array(),
})
