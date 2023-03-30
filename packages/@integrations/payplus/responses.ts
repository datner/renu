import * as S from "@effect/schema/Schema";

// ============= Get Status ====================

export const StatusSuccess = S.struct({
  results: S.struct({
    status: S.literal("success"),
    code: S.literal(0),
    description: S.literal("operation has been success"),
  }),
  data: S.struct({
    transaction_uid: S.string,
    page_request_uid: S.string,
    is_multiple_transaction: S.boolean,
    type: S.string,
    method: S.string,
    number: S.string,
    date: S.string, // "2022-12-13 13:19:44"
    status: S.string,
    status_code: S.string,
    status_description: S.string,
    amount: S.number,
    currency: S.string,
    credit_terms: S.string,
    number_of_payments: S.number,
    secure3D_status: S.boolean,
    secure3D_tracking: S.boolean,
    approval_num: S.string,
    card_foreign: S.string,
    voucher_num: S.string,
    more_info: S.string,
    add_data: S.unknown,
    customer_uid: S.string,
    customer_email: S.string,
    company_name: S.string,
    company_registration_number: S.number,
    terminal_uid: S.string,
    terminal_name: S.string,
    terminal_merchant_number: S.string,
    cashier_uid: S.string,
    cashier_name: S.string,
    four_digits: S.string,
    expiry_month: S.string,
    expiry_year: S.string,
    alternative_method: S.boolean,
    customer_name: S.string,
    customer_name_invoice: S.string,
    identification_number: S.string,
    clearing_id: S.number,
    brand_id: S.number,
    issuer_id: S.string,
    extra_3: S.unknown,
    card_holder_name: S.unknown,
    card_bin: S.string,
    more_info_1: S.string,
    more_info_2: S.unknown,
    more_info_3: S.unknown,
    more_info_4: S.unknown,
    more_info_5: S.unknown,
    clearing_name: S.string,
    brand_name: S.string,
    issuer_name: S.string,
  }),
});
export interface StatusSuccess extends S.To<typeof StatusSuccess> {}

export const StatusError = S.struct({
  results: S.struct({
    status: S.literal("error"),
    code: S.literal(1),
    description: S.literal("can-not-find-transaction"),
  }),
  data: S.struct({}),
});
export interface StatusError extends S.To<typeof StatusError> {}

export const StatusUnexpected = S.struct({
  results: S.struct({
    status: S.literal("error"),
    code: S.number,
    description: S.string,
  }),
  data: S.record(S.string, S.unknown),
});
export interface StatusUnexpected extends S.To<typeof StatusUnexpected> {}

export const GetStatusResponse = S.union(StatusSuccess, StatusError, StatusUnexpected);
export type GetStatusResponse = StatusSuccess | StatusError | StatusUnexpected;

// ============= Get Payment Page Link ====================

export const ResponseResults = S.struct({
  status: S.literal("success"),
  code: S.number,
  description: S.string,
});

export const GeneratePaymentLinkResponse = S.struct({
  results: ResponseResults,
  data: S.struct({
    page_request_uid: S.string,
    payment_page_link: S.string,
    qr_code_image: S.string,
  }),
});
