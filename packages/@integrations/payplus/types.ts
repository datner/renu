import type { NonEmptyReadonlyArray } from "@effect/data/ReadonlyArray"

export interface PaymentItem {
  readonly name: string
  readonly product_invoice_extra_details?: string | null | undefined
  readonly image_url: string
  readonly quantity: number
  readonly price: number
  readonly vat_type: 0
}

export interface GeneratePaymentLinkBody {
  readonly language_code: "he" | "en"
  readonly payment_page_uid: string

  /**
   * @default 1
   */
  readonly charge_method: 1 | 2 | 3 | 4 | 5
  readonly more_info: string
  readonly more_info_1: string
  readonly more_info_2?: string | undefined
  readonly more_info_3?: string | undefined
  readonly more_info_4?: string | undefined
  readonly more_info_5?: string | undefined
  readonly refURL_success?: string | URL | undefined
  readonly refURL_failure?: string | URL | undefined
  readonly refURL_callback?: string | URL | undefined
  readonly customer: {
    readonly customer_name: string
    readonly email: string
    readonly phone: string
    readonly vat_number: number
  }
  readonly items: NonEmptyReadonlyArray<PaymentItem>
  readonly amount: number
  readonly expiry_datetime: "30"
  readonly currency_code: "ILS"
  readonly payments?: 1 | undefined
  readonly sendEmailApproval: boolean
  readonly sendEmailFailure: boolean
}
