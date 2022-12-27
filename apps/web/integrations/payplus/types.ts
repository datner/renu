import { callbackUrl, errorUrl, getAmount, successUrl } from "integrations/helpers"
import { z } from "zod"

export const PaymentItem = z
  .object({
    name: z.string(),
    product_invoice_extra_details: z.string().nullish(),
    image_url: z
      .string()
      .transform((uri) => `https://renu.imgix.net${uri}?auto=format&fit=max&w=256&q=20`),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
  })
  .transform((it) => ({ ...it, vat_type: 0 }))

export type PaymentItemInput = z.input<typeof PaymentItem>
export type PaymentItem = z.infer<typeof PaymentItem>

export interface IPNBody {
  payment_request_uid?: string
  transaction_uid?: string
  related_transaction?: boolean
  approval_num?: string
  voucher_num?: string
  more_info?: string
}

export const GeneratePaymentLinkBody = z
  .object({
    language_code: z.enum(["en", "he"]).default("he"),
    payment_page_uid: z.string().uuid(),
    charge_method: z.number().gte(0).lte(5).default(1),
    more_info: z.string(),
    more_info_1: z.string().optional(),
    more_info_2: z.string().optional(),
    more_info_3: z.string().optional(),
    more_info_4: z.string().optional(),
    more_info_5: z.string().optional(),
    refURL_success: z.string().optional().default(successUrl),
    refURL_failure: z.string().optional().default(errorUrl),
    refURL_callback: z.string().optional().default(callbackUrl),
    customer: z
      .object({
        customer_name: z.string(),
        email: z.string(),
        phone: z.string(),
        vat_number: z.number(),
      })
      .default({ vat_number: 0, customer_name: "", phone: "", email: "" }),
    items: PaymentItem.array(),
  })
  .transform((it) => ({
    ...it,
    amount: getAmount(it.items),
    expiry_datetime: "30",
    currency_code: "ILS",
    payments: 1,
    sendEmailApproval: Boolean(it.customer.email),
    sendEmailFailure: Boolean(it.customer.email),
  }))

export type GeneratePaymentLinkInput = z.input<typeof GeneratePaymentLinkBody>

const Status = z.enum(["success"])

const ResponseResults = z.object({
  status: Status,
  code: z.number(),
  description: z.string(),
})

export const GeneratePaymentLinkResponse = z.object({
  results: ResponseResults,
  data: z.object({
    page_request_uid: z.string().uuid(),
    payment_page_link: z.string().url(),
  }),
})
export type GeneratePaymentLinkResponse = z.infer<typeof GeneratePaymentLinkResponse>

const InvoiceType = z.enum(["Invoice Receipt", "Credit Invoice"])

export const Invoice = z.object({
  status: Status,
  type: InvoiceType,
  date: z.string(),
  original_doc_url: z.string().url(),
  copy_doc_url: z.string().url(),
})

export type Invoice = z.infer<typeof Invoice>
export const InvoiceNotFound = z.literal("cannot-find-invoice-for-this-transaction")

export const InvoiceResponse = z.object({
  invoices: Invoice.array(),
})

export const StatusSuccess = z.object({
  results: z.object({
    status: z.literal("success"),
    code: z.literal(0),
    description: z.literal("operation has been success"),
  }),
  data: z.object({
    transaction_uid: z.string(),
    page_request_uid: z.string(),
    is_multiple_transaction: z.boolean(),
    type: z.string(),
    method: z.string(),
    number: z.string(),
    date: z.string(), //"2022-12-13 13:19:44"
    status: z.string(),
    status_code: z.string(),
    status_description: z.string(),
    amount: z.number(),
    currency: z.string(),
    credit_terms: z.string(),
    number_of_payments: z.number(),
    secure3D_status: z.boolean(),
    secure3D_tracking: z.boolean(),
    approval_num: z.string(),
    card_foreign: z.string(),
    voucher_num: z.string(),
    more_info: z.string(),
    add_data: z.unknown(),
    customer_uid: z.string(),
    customer_email: z.string(),
    company_name: z.string(),
    company_registration_number: z.number(),
    terminal_uid: z.string(),
    terminal_name: z.string(),
    terminal_merchant_number: z.string(),
    cashier_uid: z.string(),
    cashier_name: z.string(),
    four_digits: z.string(),
    expiry_month: z.string(),
    expiry_year: z.string(),
    alternative_method: z.boolean(),
    customer_name: z.string(),
    customer_name_invoice: z.string(),
    identification_number: z.string(),
    clearing_id: z.number(),
    brand_id: z.number(),
    issuer_id: z.string(),
    extra_3: z.unknown(),
    card_holder_name: z.unknown(),
    card_bin: z.string(),
    more_info_1: z.string(),
    more_info_2: z.unknown(),
    more_info_3: z.unknown(),
    more_info_4: z.unknown(),
    more_info_5: z.unknown(),
    clearing_name: z.string(),
    brand_name: z.string(),
    issuer_name: z.string(),
  }),
})
export type StatusSuccess = z.infer<typeof StatusSuccess>

export const StatusError = z.object({
  results: z.object({
    status: z.literal("error"),
    code: z.literal(1),
    description: z.literal("can-not-find-transaction"),
  }),
  data: z.object({}),
})
export type StatusError = z.infer<typeof StatusError>

export const StatusUnexpected = z.object({
  results: z.object({
    status: z.literal("error"),
    code: z.number(),
    description: z.string(),
  }),
  data: z.record(z.unknown()),
})
export type StatusUnexpected = z.infer<typeof StatusUnexpected>

export const GetStatusResponse = z.union([StatusSuccess, StatusError, StatusUnexpected])

export type GetStatusResponse = z.infer<typeof GetStatusResponse>

export const Authorization = z.object({
  api_key: z.string(),
  secret_key: z.string(),
  isQA: z.boolean().default(false),
})

export type Authorization = z.infer<typeof Authorization>

export type InvoiceStatusError = {
  tag: "invoiceStatusError"
  docUrl: string
}
