import * as S from "@effect/schema/Schema";
import { pipe, ReadonlyRecord } from "effect";

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
} as const;
export type ORDER_STATUS = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const DISCOUNT_TYPES = {
  ABSOLUTE: "ABSOLUTE",
  PERCENT: "PERCENT",
} as const;
export type DISCOUNT_TYPES = (typeof DISCOUNT_TYPES)[keyof typeof DISCOUNT_TYPES];

export const PAYMENT_TYPES = {
  CASH: "CASH",
  CREDIT: "CREDIT",
  EXTERNAL: "EXTERNAL",
  TENBIS: "TENBIS",
} as const;
export type PAYMENT_TYPES = (typeof PAYMENT_TYPES)[keyof typeof PAYMENT_TYPES];

export const DELIVERY_TYPES = {
  DELIVERY: "DELIVERY",
  PICKUP: "PICKUP",
  INPLACE: "INPLACE",
  TAKEAWAY: "TAKEAWAY",
} as const;
export type DELIVERY_TYPES = (typeof DELIVERY_TYPES)[keyof typeof DELIVERY_TYPES];

export const Transaction = S.struct({
  type: S.enums(PAYMENT_TYPES),
  amount: S.number,
  id: S.optional(pipe(S.string, S.description("Payment reference number"))),
  transactionInfo: S.optional(S.record(S.string, S.unknown)),
}) satisfies S.Schema<any, Transaction>;

export const Payment = S.struct({
  totalAmount: S.number,
  transactions: S.array(Transaction),
  delivery: S.optional(
    S.struct({
      // TODO: finish this interface
      price: S.number,
      tip: S.number,
    }),
  ),
});
export interface Payment extends S.Schema.To<typeof Payment> {}

export const Modifier: S.Schema<Modifier, Modifier> = S.suspend(() =>
  S.struct({
    modifierId: S.optional(pipe(
      S.union(S.number, S.string),
      S.description("Will be added \"soon\""),
    )),
    modifierText: S.optional(pipe(
      S.string,
      S.description("Title of the modifier ex. \"Toppings\", \"Chicken or Beef\""),
    )),
    id: pipe(S.string, S.description("The id of the item to modifier")),
    name: S.optional(pipe(S.string, S.description("Name of the selected modifier"))),
    price: pipe(S.number, S.description("price of single modifier in shekels")),
    quantity: S.number,
    included: pipe(
      S.boolean,
      S.description(`
   should the price be added to the total price?
   true - price is not calculated with the modifier, add
   false - price is calculated witht the modifier, do not add
`),
    ),
    modifiers: S.optional(pipe(Item, S.array)),
  })
);

export const Item = S.suspend(() =>
  S.struct({
    id: pipe(S.string, S.description("As appears in Dorix POS, or not...")),
    name: S.optional(pipe(S.string, S.description("If not in Dorix POS, use this name"))),
    price: pipe(S.number, S.description("Of a single item, in shekels")),
    quantity: S.number,
    notes: S.string,
    modifiers: S.optional(pipe(Modifier, S.array)),
  })
);
export interface Item extends S.Schema.To<typeof Item> {}

export const Order = S.struct({
  branchId: S.string,
  source: S.literal("RENU"),
  externalId: S.string,
  notes: S.string,
  desiredTime: S.string,
  type: S.literal("PICKUP"),
  payment: Payment,
  metadata: S.record(S.string, S.any),
  webhooks: S.optional(
    S.struct({
      status: S.string,
    }),
  ),
  items: S.array(Item),
  customer: S.any,
  delivery: S.optional(S.any),
  discounts: S.any,
}) satisfies S.Schema<any, Order>;

export const OrderCustomer: S.Schema<OrderCustomer> = S.struct({
  firstName: S.string,
  lastName: S.string,
  phone: S.string,
  email: S.string,
});

export interface Transaction {
  readonly type: PAYMENT_TYPES;
  readonly amount: number;
  /** payment reference number */
  readonly id?: string;
  readonly transactionInfo?: ReadonlyRecord.ReadonlyRecord<unknown>;
}

export interface Modifier {
  /** will be added "soon" */
  readonly modifierId?: number | string;

  /** title of the modifier ex. "Toppings", "Chicken or Beef" */
  readonly modifierText?: string;

  /** The id of the item to modify */
  readonly id: string;

  /** name of the selected modifier */
  readonly name?: string;

  /** price of single modifier in shekels */
  readonly price: number;

  readonly quantity: number;

  /**
   * should the price be added to the total price?
   * true - price is not calculated with the modifier, add
   * false - price is calculated witht the modifier, do not add
   */
  readonly included: boolean;

  /* not sure what this is for */
  readonly modifiers?: readonly Item[];
}

export interface Order {
  /** Id of the POS */
  readonly branchId: string;

  readonly source: "RENU";

  /** Id in my own system */
  readonly externalId: string;

  /** notes about the order -- appears on invoice */
  readonly notes: string;

  /**
   * delivery time in ISO
   * @deprecated we don't do delivery
   */
  readonly desiredTime: string;

  readonly type: "PICKUP";

  readonly payment: Payment;

  /** any additional data you would like to add to the order - this data is returned in status webhooks/request */
  readonly metadata: Record<string, any>;

  readonly webhooks?:
    | {
      /** a route which accepts POST requests to get status updates about the order */
      readonly status: string;
    }
    | undefined;

  readonly items: readonly Item[];

  /** customer information */
  readonly customer: OrderCustomer;

  readonly delivery?: OrderDelivery | undefined;

  /**
   * @deprecated unused
   */
  readonly discounts: Discount[];
}

export interface Discount {
  notes: string;
  amount: number;
  type: DISCOUNT_TYPES;
}

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface OrderDelivery {
  address: OrderDeliveryAddress;
  notes: string;
}

export interface OrderDeliveryAddress {
  country: string;
  city: string;
  street: string;
  zipcode?: string;
  number: number;
  floor?: number;
  entrance?: string;
  apartmentNumber?: string;
  plain: string;
}
