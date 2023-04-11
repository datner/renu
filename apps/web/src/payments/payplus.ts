import * as S from "@effect/schema/Schema";

const TransactionType = {
  charge: "Charge",
  refund: "Refund",
} as const;
export const PayPlusCallback = S.struct({
  transaction_type: S.enums(TransactionType),
  transaction: S.struct({
    uid: S.string,
    payment_request_uid: S.optional(S.string),
    number: S.string,
    type: S.string,
    date: S.dateFromString(S.string),
    status_code: S.string,
    amount: S.number,
    currency: S.literal("ILS"),
    credit_terms: S.string,
    payments: S.struct({
      number_of_payments: S.number,
      first_payment_amount: S.number,
      rest_payments_amount: S.number,
    }),
    secure3D: S.struct({
      status: S.boolean,
      tracking: S.null, // no idea what this should be
    }),
    approval_number: S.string, // not actually a number, can start with 0
    voucher_number: S.string, // again not number, a code XX-XXX-XX
    more_info: S.numberFromString(S.string),
    more_info_1: S.numberFromString(S.string),
    more_info_2: S.optional(S.string),
    more_info_3: S.optional(S.string),
    more_info_4: S.optional(S.string),
    more_info_5: S.optional(S.string),
    recurring_charge_information: S.optional(
      S.struct({
        recurring_uid: S.string,
        charge_uid: S.string,
      }),
    ),
  }),
  data: S.struct({
    customer_uid: S.string,
    terminal_uid: S.string,
    cashier_uid: S.optional(S.string),
    items: S.array(S
      .struct({
        vat: S.optional(S.number),
        name: S.string,
        barcode: S.optional(S.string),
        quantity: S.number,
        amount_pay: S.number,
        product_uid: S.string,
        quantity_price: S.number,
        discount_amount: S.number,
        discount_type: S.null, // todo: figure this one out
        discount_value: S.optional(S.number),
      })),
    card_information: S.struct({
      card_holder_name: S.optional(S.string),
      four_digits: S.string, // "1792"
      expiry_month: S.string, // "01"
      expiry_year: S.string, // 26
      clearing_id: S.number,
      brand_id: S.number,
      issuer_id: S.number,
      card_foreign: S.number,
      card_bin: S.string,
    }),
  }),
  invoice: S.optional(
    S
      .struct({
        uuid: S.string,
        docu_number: S.string,
        original_url: S.string,
        copy_url: S.string,
        integrator_name: S.string,
        status: S.string, // can be Success or................. what?
      }),
  ),
});

export interface PayPlusCallback extends S.To<typeof PayPlusCallback> {}
