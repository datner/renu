import * as Layer from "@effect/io/Layer"
import * as Effect from "@effect/io/Effect"
import { CircuitBreaker, Clearing, Common, Http } from "@integrations/core"
import * as Context from "@fp-ts/data/Context"
import * as P from "@fp-ts/schema/Parser"
import * as E from "@fp-ts/data/Either"
import { ClearingProvider } from "database"
import { IntegrationService, PayPlusConfig } from "./settings"
import { flow, pipe } from "@fp-ts/data/Function"
import crypto from "crypto"
import { GetStatusResponse } from "./responses"

interface PayPlusService extends Clearing.ClearingService {
  _tag: typeof ClearingProvider.PAY_PLUS
}
export const PayPlusService = Context.Tag<PayPlusService>()

const payPlusHttpConfigLayer = Layer.effect(
  Http.HttpConfigService,
  Effect.gen(function* ($) {
    const { vendorData } = yield* $(Effect.service(IntegrationService))
    const { isQA = false, ...creds } = vendorData
    const { url } = yield* $(Effect.config(PayPlusConfig(isQA)))

    return {
      baseUrl: url,
      headers: { Authorization: JSON.stringify(creds) },
    }
  })
)

const dorixIdentityLayer = Layer.succeed(Common.IdentityService, { name: "PayPlus" })

const authorizeResponse = (res: Response) =>
  Effect.serviceWithEffect(IntegrationService, (integration) =>
    pipe(
      Effect.succeed(res),
      Effect.tap((r) =>
        Effect.cond(
          () => r.headers.get("user-agent") === "PayPlus",
          () => r,
          () =>
            new Clearing.ClearingError(
              `Payplus user agent is ${res.headers.get("user-agent")} and not as expected`,
              { provider: "PAY_PLUS" }
            )
        )
      ),
      Effect.tap((r) =>
        pipe(
          Effect.promise(() => res.text()),
          Effect.flatMap((text) =>
            Effect.cond(
              () =>
                crypto
                  .createHmac("sha256", integration.vendorData.secret_key)
                  .update(text)
                  .digest("base64") === res.headers.get("hash"),
              () => r,
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
  )

export const PayPlusLayer = Layer.effect(PayPlusService)(
  Effect.gen(function* ($) {
    const state = yield* $(CircuitBreaker.initState)
    const provideBreakerState = Effect.provideService(CircuitBreaker.BreakerStateService)({
      state,
    })

    return {
      _tag: ClearingProvider.PAY_PLUS,
      validateTransaction: (order) =>
        pipe(
          Http.request("/api/v1.0/PaymentPages/ipn", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              related_transaction: false,
              more_info: String(order.id),
            }),
          }),
          Effect.flatMap(Http.toJson),
          Effect.map(P.decode(GetStatusResponse)),
          Effect.mapError(
            (cause) =>
              new Clearing.ClearingError("could not validateTransaction", {
                cause,
                provider: "PAY_PLUS",
              })
          )
        ),
    }
  })
)
