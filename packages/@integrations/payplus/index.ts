import * as Layer from "@effect/io/Layer"
import * as Effect from "@effect/io/Effect"
import * as Context from "@effect/data/Context"
import * as A from "@effect/data/ReadonlyArray"
import * as Parser from "@effect/schema/Parser"
import { divide } from "@effect/data/Number"
import { pipe } from "@effect/data/Function"
import crypto from "crypto"
import { ClearingProvider } from "database"
import { ClearingError } from "@integrations/core/clearing"
import { CircuitBreaker, Clearing, Common, Http } from "@integrations/core"
import { Integration, IntegrationService, PayPlusConfig } from "./settings"
import { GeneratePaymentLinkResponse, GetStatusResponse, StatusSuccess } from "./responses"
import { GeneratePaymentLinkBody, PaymentItem } from "./types"

export interface PayPlusService extends Clearing.ClearingService {
  _tag: typeof ClearingProvider.PAY_PLUS
}
export const Tag = Context.Tag<PayPlusService>()

const provideHttpConfig = Effect.provideServiceEffect(
  Http.HttpConfigService,
  Effect.gen(function* ($) {
    const { vendorData } = yield* $(Effect.service(IntegrationService))
    const { isQA = false, ...creds } = vendorData
    const config = yield* $(Effect.config(PayPlusConfig))
    const { url } = isQA ? config.qa : config

    return {
      baseUrl: url,
      headers: { Authorization: JSON.stringify(creds) },
    }
  })
)

const toPayload = ({ items, id, venueId }: Clearing.FullOrderWithItems) =>
  Effect.gen(function* ($) {
    const integration = yield* $(Effect.service(IntegrationService))
    const { host } = yield* $(Effect.config(Common.config))
    const successUrl = new URL(`payments/success`, host)
    const errorUrl = new URL(`payments/error`, host)
    const callbackUrl = new URL(`payments/callback`, host)

    // to satisfy typescript I need the double negative
    if (!A.isNonEmptyArray(items)) return yield* $(Effect.die(new Error("order has no items")))

    return {
      items: pipe(
        items,
        A.mapNonEmpty(
          (it): PaymentItem => ({
            price: divide(100)(it.price),
            quantity: it.quantity,
            name: it.name,
            image_url: `http://renu.imgix.net${it.item.image}?auto=format&fix=max&w=256&q=20`,
            product_invoice_extra_details: it.comment,
            vat_type: 0,
          })
        )
      ),
      payment_page_uid: integration.terminal,
      more_info: String(id),
      more_info_1: String(venueId),

      amount: pipe(
        items,
        A.reduce(0, (sum, item) => sum + item.quantity * item.price),
        divide(100)
      ),
      customer: {
        customer_name: "",
        email: "",
        phone: "",
        vat_number: 0,
      },
      expiry_datetime: "30",
      language_code: "he",
      currency_code: "ILS",
      sendEmailApproval: false,
      sendEmailFailure: false,
      charge_method: 1,
      refURL_success: successUrl,
      refURL_failure: errorUrl,
      refURL_callback: callbackUrl,
    } as GeneratePaymentLinkBody
  })

const authorizeResponse = (res: Response) =>
  Effect.serviceWithEffect(IntegrationService, (integration) =>
    pipe(
      Effect.succeed(res),
      Effect.filterOrFail(
        (r) => r.headers.get("user-agent") === "PayPlus",
        () =>
          new Clearing.ClearingError(
            `Payplus user agent is ${res.headers.get("user-agent")} and not as expected`,
            { provider: "PAY_PLUS" }
          )
      ),
      Effect.tap((res) =>
        pipe(
          Effect.promise(() => res.clone().text()),
          Effect.filterOrFail(
            (text) =>
              crypto
                .createHmac("sha256", integration.vendorData.secret_key)
                .update(text)
                .digest("base64") === res.headers.get("hash"),
            () =>
              new Clearing.ClearingError(
                `PayPlus response hash does not match. Man in the middle attack suspected`,
                { provider: "PAY_PLUS" }
              )
          )
        )
      )
    )
  )

const parseIntegration = Effect.provideServiceEffect(
  IntegrationService,
  Effect.serviceWith(Clearing.Settings, Parser.decodeOrThrow(Integration))
)

export const layer = Layer.effect(
  Tag,
  Effect.gen(function* ($) {
    const breaker = yield* $(CircuitBreaker.makeBreaker({ name: "PayPlus" }))
    const Client = yield* $(Effect.service(Http.Tag))

    return {
      _tag: ClearingProvider.PAY_PLUS,
      validateTransaction: (order) =>
        pipe(
          Client.request("/api/v1.0/PaymentPages/ipn", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              related_transaction: false,
              more_info: String(order.id),
            }),
          }),
          Effect.flatMap(authorizeResponse),
          Effect.flatMap(Http.toJson),
          breaker((e) => {
            return e instanceof Http.HttpRequestError
          }),
          provideHttpConfig,
          parseIntegration,
          Effect.map(Parser.decodeOrThrow(GetStatusResponse)),
          Effect.filterOrFail(
            (res): res is StatusSuccess => res.results.status === "success",
            () =>
              new ClearingError("Failed to get a payment page status from payplus", {
                provider: "PAY_PLUS",
              })
          ),
          Effect.filterOrFail(
            (res) => res.data.status_code === "000",
            () =>
              new ClearingError("Transaction failed", {
                provider: "PAY_PLUS",
              })
          ),
          Effect.mapBoth(
            (cause) => {
              if (cause instanceof Clearing.ClearingError) return cause

              return new Clearing.ClearingError("could not generate payment link", {
                cause,
                provider: "PAY_PLUS",
              })
            },
            (r) => Clearing.TxId(r.data.transaction_uid)
          )
        ),

      getClearingPageLink: (order) =>
        pipe(
          toPayload(order),
          Effect.map(JSON.stringify),
          Effect.tap(Effect.log),
          Effect.flatMap((body) =>
            Client.request("/api/v1.0/PaymentPages/generateLink", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body,
            })
          ),
          Effect.flatMap(authorizeResponse),
          Effect.flatMap(Http.toJson),
          breaker((e) => {
            return e instanceof Http.HttpRequestError || e instanceof Http.HttpResponseError
          }),
          provideHttpConfig,
          parseIntegration,
          Effect.map((res) =>
            Parser.decodeOrThrow(GeneratePaymentLinkResponse)(res, { isUnexpectedAllowed: true })
          ),
          Effect.map((r) => r.data.payment_page_link),
          Effect.map((link) => new URL(link)),
          Effect.mapError((cause) => {
            if (cause instanceof Clearing.ClearingError) return cause

            return new Clearing.ClearingError("could not generate payment link", {
              cause,
              provider: "PAY_PLUS",
            })
          })
        ),
    }
  })
)
