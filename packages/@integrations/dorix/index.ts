import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as Config from "@effect/io/Config"
import * as ConfigSecret from "@effect/io/Config/Secret"
import { flow, pipe } from "@fp-ts/data/Function"
import * as Duration from "@fp-ts/data/Duration"
import * as E from "@fp-ts/data/Either"
import * as T from "@fp-ts/data/These"
import * as J from "@fp-ts/data/Json"
import * as Chunk from "@fp-ts/data/Chunk"
import * as D from "@fp-ts/schema/Decoder"
import { CircuitBreaker, Http, Common, Management } from "@integrations/core"
import { isTaggedError, taggedError } from "shared/errors"
import { Integration, IntegrationService, StatusResponse, toOrder } from "./helpers"
import { OrderState } from "database"

const decodeToEffect =
  <I, A>(decoder: D.Decoder<I, A>) =>
  (i: I) =>
    pipe(
      decoder.decode(i),
      T.toEither((_, a) => E.right(a)),
      E.mapLeft(Chunk.unsafeFromArray),
      Effect.fromEither
    )

const DorixConfig = (isQA = false) =>
  Config.struct({
    url: Config.string(`DORIX_${isQA ? "QA_" : ""}API_URL`),
    apiKey: Config.secret(`DORIX_${isQA ? "QA_" : ""}API_KEY`),
  })

const dorixIntegrationLayer = Layer.fromEffect(IntegrationService)(
  Effect.serviceWithEffect(Management.IntegrationSettingsService)(decodeToEffect(Integration))
)

const dorixHttpConfigLayer = Layer.fromEffect(Http.HttpConfigService)(
  Effect.gen(function* ($) {
    const { vendorData } = yield* $(Effect.service(IntegrationService))
    const { isQA = false } = vendorData
    const { url, apiKey } = yield* $(Effect.config(DorixConfig(isQA)))

    return {
      baseUrl: url,
      headers: { Authorization: `Bearer ${ConfigSecret.value(apiKey)}` },
    }
  })
)

const dorixIdentityLayer = Layer.succeed(Common.IdentityService)({ name: "Dorix" })

const dorixCircuitBreakerConfigLayer = Layer.succeed(CircuitBreaker.BreakerConfigService)({
  maxFailure: 3,
  cooldown: Duration.seconds(10),
})

const dorixCircuitBreakerLayer = pipe(
  dorixCircuitBreakerConfigLayer,
  Layer.merge(CircuitBreaker.Layers.DefaultBreakerState)
)

const dorixLayer = pipe(
  dorixIdentityLayer,
  Layer.merge(dorixCircuitBreakerLayer),
  Layer.merge(dorixIntegrationLayer),
  Layer.provideToAndMerge(dorixHttpConfigLayer),
  Layer.provideToAndMerge(Http.Layers.HttpFetchService),
  Layer.merge(Common.Layers.DefaultRetrySchedule)
)

export const DorixService = Layer.succeed(Management.ManagementService)({
  reportOrder: flow(
    toOrder,
    Effect.map(J.stringify),
    Effect.absolve,
    Effect.mapError(taggedError("JsonStringifyError")),
    Effect.flatMap((body) =>
      Http.request("/endpoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      })
    ),
    CircuitBreaker.breaker(flow(isTaggedError("HttpRequestError"))),
    Effect.provideLayer(dorixLayer),
    Effect.mapError(Management.managementError),
    Effect.asUnit
  ),

  getOrderStatus: (order) =>
    pipe(
      Effect.service(IntegrationService),
      Effect.map(
        // ?branchId={branchId}&source=RENU
        ({ vendorData: { branchId } }) => new URLSearchParams({ branchId, source: "RENU" })
      ),
      Effect.flatMap((qs) => Http.request(`/v1/order/${order.id}/status?${qs.toString()}`)),
      Effect.flatMap(Http.toJson),
      Effect.flatMap(decodeToEffect(StatusResponse)),
      Effect.map((p) => {
        switch (p.order.status) {
          case "FAILED":
          case "UNREACHABLE":
            return OrderState.Cancelled

          case "AWAITING_TO_BE_RECEIVED":
            return OrderState.Unconfirmed

          default:
            return OrderState.Confirmed
        }
      }),
      Effect.provideLayer(dorixLayer),
      Effect.mapError(Management.managementError)
    ),
})
