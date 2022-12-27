import * as J from "fp-ts/Json"
import * as E from "fp-ts/Either"
import * as RE from "fp-ts/ReaderEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import { pipe, apply } from "fp-ts/function"
import { getEnvVar } from "src/core/helpers/env"
import {
  FullOrderWithItems,
  ClearingProvider,
  ClearingIntegrationEnv,
} from "integrations/clearing/clearingProvider"
import { ensureClearingMatch } from "integrations/clearing/clearingGuards"
import { ClearingIntegration, ClearingProvider as CP, Order } from "@prisma/client"
import { ensureType } from "src/core/helpers/zod"
import {
  Authorization,
  GeneratePaymentLinkBody,
  GeneratePaymentLinkResponse,
  GetStatusResponse,
  IPNBody,
  StatusSuccess,
} from "./types"
import { RequestOptions } from "integrations/http/httpClient"
import { toItems } from "integrations/payplus/lib"
import {
  TransactionFailedError,
  TransactionNotFoundError,
} from "integrations/clearing/clearingErrors"
import { httpServerError, HttpContentError } from "integrations/http/httpErrors"
import { singletonBreaker } from "integrations/http/circuitBreaker"
import crypto from "crypto"

const auth = (integration: ClearingIntegration) =>
  pipe(
    integration,
    ensureClearingMatch(CP.PAY_PLUS),
    E.map((ci) => ci.vendorData),
    E.chainW(ensureType(Authorization))
  )

const toPayload = (order: FullOrderWithItems, payment_page_uid: string) =>
  GeneratePaymentLinkBody.parse({
    items: toItems(order.items),
    more_info: String(order.id),
    more_info_1: String(order.venueId),
    payment_page_uid,
  })

const payplusBreaker = singletonBreaker("PayPlus")

export const payplusRequest =
  (url: string | URL, init?: RequestOptions | undefined) => (integration: ClearingIntegration) =>
    pipe(
      E.Do,
      E.apS("Authorization", auth(integration)),
      E.bindW("prefixUrl", ({ Authorization: { isQA } }) =>
        getEnvVar(isQA ? "PAY_PLUS_QA_API_URL" : "PAY_PLUS_API_URL")
      ),
      E.bindW("headers", ({ Authorization }) =>
        pipe(
          J.stringify(Authorization),
          E.mapLeft(
            (error): HttpContentError => ({
              tag: "HttpContentError",
              error,
              raw: Authorization,
              target: "text",
            })
          )
        )
      ),
      E.map(({ prefixUrl, Authorization, headers }) => ({
        url: new URL(url, prefixUrl),
        options: {
          ...init,
          headers: Object.assign({ Authorization: headers }, init?.headers),
        } as RequestOptions,
        secretKey: Authorization.secret_key,
      })),
      RTE.fromEither,
      RTE.bindW("response", ({ url, options }) => payplusBreaker(url, options)),
      RTE.bindW("text", ({ response }) => RTE.fromTaskEither(response.text)),
      RTE.chainEitherKW(({ response, secretKey, text }) =>
        pipe(
          response,
          E.fromPredicate(
            (r) => r.headers["user-agent"] === "PayPlus",
            (r) =>
              httpServerError(
                new Error(`Payplus user agent is ${r.headers["user-agent"]} and not as expected`)
              )
          ),
          E.chain(
            E.fromPredicate(
              (r) =>
                crypto.createHmac("sha256", secretKey).update(text).digest("base64") ===
                r.headers["hash"],
              () =>
                httpServerError(
                  new Error(
                    `PayPlus response hash does not match. Man in the middle attack suspected`
                  )
                )
            )
          )
        )
      )
    )

const toIPNBody = (order: Order): IPNBody => ({
  related_transaction: false,
  more_info: String(order.id),
})

export type PayPlusNotFound = {
  tag: "payPlusNotFound"
  txId: string
}

const ensureStatusSuccess = (response: GetStatusResponse) =>
  pipe(
    response,
    E.fromPredicate(
      (r): r is StatusSuccess => r.results.status === "success",
      (r) =>
        ({
          tag: "TransactionNotFoundError",
          provider: "PAY_PLUS",
          error: new Error(`payplus returned ${r.results.description}`),
        } as TransactionNotFoundError)
    )
  )

const ensureTransactionSuccess = (response: StatusSuccess) =>
  pipe(
    response,
    E.fromPredicate(
      (r) => r.data.status_code === "000",
      (r) =>
        ({
          tag: "TransactionFailedError",
          orderId: Number(r.data.more_info),
          error: new Error(`payplus returned ${r.results.description}`),
        } as TransactionFailedError)
    )
  )

export const payplusProvider: ClearingProvider = {
  getClearingPageLink: (order) =>
    RTE.asksReaderTaskEitherW((env: ClearingIntegrationEnv) =>
      pipe(
        toPayload(order, env.clearingIntegration.terminal),
        (json) => payplusRequest("/api/v1.0/PaymentPages/generateLink", { method: "POST", json }),
        apply(env.clearingIntegration),
        RTE.chainTaskEitherKW((r) => r.json),
        RTE.chainEitherKW(ensureType(GeneratePaymentLinkResponse)),
        RTE.map((r) => r.data.payment_page_link)
      )
    ),

  validateTransaction: (order) =>
    RTE.asksReaderTaskEitherW((env: ClearingIntegrationEnv) =>
      pipe(
        payplusRequest("/api/v1.0/PaymentPages/ipn", { method: "POST", json: toIPNBody(order) }),
        apply(env.clearingIntegration),
        RTE.chainTaskEitherKW((r) => r.json),
        RTE.chainEitherKW(ensureType(GetStatusResponse)),
        RTE.chainEitherKW(ensureStatusSuccess),
        RTE.chainEitherKW(ensureTransactionSuccess),
        RTE.map((r) => r.data.transaction_uid)
      )
    ),
}
