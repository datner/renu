import { z } from "zod"

export type Payment<T extends DELIVERY_TYPES = DELIVERY_TYPES.PICKUP> = {
  // in shekels.....
  totalAmount: number

  transactions: Transaction[]
} & T extends "PICKUP"
  ? {}
  : {
      delivery: {
        // TODO: finish this interface
        price: number
        tip: number
      }
    }

export interface Item {
  /** as appears in Dorix POS, or not... */
  id: string

  /** If not in Dorix POS, use this name */
  name?: string

  /** of a single item, in shekels */
  price: number

  quantity: number

  notes: string

  modifiers?: Modifier[]
}

export interface Modifier {
  /** will be added "soon" */
  modifierId?: number | string

  /** title of the modifier ex. "Toppings", "Chicken or Beef" */
  modifierText?: string

  /** The id of the item to modify */
  id: string

  /** name of the selected modifier */
  name?: string

  /** price of single modifier in shekels */
  price: number

  quantity: number

  /**
   * should the price be added to the total price?
   * true - price is not calculated with the modifier, add
   * false - price is calculated witht the modifier, do not add
   */
  included: boolean

  /* not sure what this is for */
  modifiers?: Item[]
}

export interface Order<T extends DELIVERY_TYPES = DELIVERY_TYPES.PICKUP> {
  /** Id of the POS */
  branchId: string

  source: "RENU"

  /** Id in my own system */
  externalId: string

  /** notes about the order -- appears on invoice */
  notes: string

  /**
   * delivery time in ISO
   * @deprecated we don't do delivery
   */
  desiredTime: string

  type: T

  payment: Payment<T>

  /** any additional data you would like to add to the order - this data is returned in status webhooks/request */
  metadata: Record<string, any>

  webhooks?: {
    /** a route which accepts POST requests to get status updates about the order */
    status: string
  }

  items: Item[]

  /** customer information */
  customer: OrderCustomer

  delivery?: OrderDelivery

  /**
   * @deprecated unused
   */
  discounts: Discount[]
}

export const DorixVendorData = z.object({
  branchId: z.string(),
  isQA: z.boolean().default(false),
})
export type DorixVendorData = z.infer<typeof DorixVendorData>

export const ORDER_STATUS = {
  PENDING_ORDER_COMPLETION: "PENDING_ORDER_COMPLETION",
  AWAITING_TO_BE_RECEIVED: "AWAITING_TO_BE_RECEIVED",
  RECEIVED: "RECEIVED",
  PREPARATION: "PREPARATION",
  AWAITING_DELIVERY_ASSIGNMENT: "AWAITING_DELIVERY_ASSIGNMENT",
  IN_DELIVERY: "IN_DELIVERY",
  PENDING_CLEARANCE: "PENDING_CLEARANCE",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
  UNREACHABLE: "UNREACHABLE",
  FAILED: "FAILED",
} as const

export enum DISCOUNT_TYPES {
  ABSOLUTE = "ABSOLUTE",
  PERCENT = "PERCENT",
}

export enum PAYMENT_TYPES {
  CASH = "CASH",
  CREDIT = "CREDIT",
  EXTERNAL = "EXTERNAL",
  TENBIS = "TENBIS",
}

export interface Discount {
  notes: string
  amount: number
  type: DISCOUNT_TYPES
}

export interface Transaction {
  type: PAYMENT_TYPES
  amount: number
  /** payment reference number */
  id?: string
  transactionInfo?: Record<string, unknown>
}

export const enum DELIVERY_TYPES {
  DELIVERY = "DELIVERY",
  PICKUP = "PICKUP",
  INPLACE = "INPLACE",
  TAKEAWAY = "TAKEAWAY",
}

export interface OrderCustomer {
  firstName: string
  lastName: string
  phone: string
  email: string
}

export interface OrderDelivery {
  address: OrderDeliveryAddress
  notes: string
}

export interface OrderDeliveryAddress {
  country: string
  city: string
  street: string
  zipcode?: string
  number: number
  floor?: number
  entrance?: string
  apartmentNumber?: string
  plain: string
}
