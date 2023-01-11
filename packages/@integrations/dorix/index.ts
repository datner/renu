import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as Config from "@effect/io/Config"
import * as ConfigSecret from "@effect/io/Config/Secret"
import { flow, pipe } from "@fp-ts/data/Function"
import * as Duration from "@fp-ts/data/Duration"
import * as E from "@fp-ts/data/Either"
import * as T from "@fp-ts/data/These"
import * as J from "@fp-ts/data/Json"
import * as P from "@fp-ts/data/Predicate"
import * as Context from "@fp-ts/data/Context"
import * as D from "@fp-ts/schema/Decoder"
import { CircuitBreaker, Http, Common, Management } from "@integrations/core"
import { isTaggedError, taggedError } from "shared/errors"
import {
  Integration,
  IntegrationService,
  SendOrderResponseDecoder,
  StatusResponse,
  toOrder,
} from "./helpers"
import { ManagementProvider, OrderState } from "database"
import { DorixMenuDecoder, toMenu } from "./menu"

const decodeToEffect =
  <I, A>(decoder: D.Decoder<I, A>) =>
  (i: I) =>
    pipe(decoder.decode(i), T.absolve, Effect.fromEither)

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

const dorixLayer = pipe(
  dorixIdentityLayer,
  Layer.merge(dorixIntegrationLayer),
  Layer.merge(dorixCircuitBreakerConfigLayer),
  Layer.provideToAndMerge(dorixHttpConfigLayer),
  Layer.provideToAndMerge(Http.Layers.HttpFetchLayer),
  Layer.merge(Common.Layers.DefaultRetrySchedule)
)

const stringify = flow(J.stringify, E.mapLeft(taggedError("JsonStringifyError")))

const isHttpError = pipe(
  isTaggedError("HttpRequestError")
  /* P.or(isTaggedError("HttpNotFoundError")) */
)

interface DorixService extends Management.ManagementService {
  _tag: typeof ManagementProvider.DORIX
}
export const DorixService = Context.Tag<DorixService>()

export const DorixServiceLayer = Layer.fromEffect(DorixService)(
  Effect.gen(function* ($) {
    const state = yield* $(CircuitBreaker.initState)
    const provideBreakerState = Effect.provideService(CircuitBreaker.BreakerStateService)({
      state,
    })

    return {
      _tag: ManagementProvider.DORIX,
      reportOrder: (order) =>
        pipe(
          toOrder(order),
          Effect.tap(() => Effect.log("reporting order to dorix")),
          Effect.map(stringify),
          Effect.absolve,
          Effect.flatMap((body) =>
            Http.request("/v1/order", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body,
            })
          ),
          CircuitBreaker.breaker(isHttpError),
          Effect.flatMap(Http.toJson),
          Effect.flatMap(decodeToEffect(SendOrderResponseDecoder)),
          Effect.flatMap((res) =>
            res.ack ? Effect.succeed(res) : Effect.fail(new Error(res.message))
          ),
          provideBreakerState,
          Effect.provideSomeLayer(dorixLayer),
          Effect.mapError(Management.managementError),
          Effect.asUnit
        ),

      getOrderStatus: (order) =>
        pipe(
          Effect.service(IntegrationService),
          Effect.tap(() => Effect.log("getting order status to dorix")),
          Effect.map(
            // ?branchId={branchId}&source=RENU
            ({ vendorData: { branchId } }) => new URLSearchParams({ branchId, source: "RENU" })
          ),
          Effect.flatMap((qs) => Http.request(`/v1/order/${order.id}/status?${qs.toString()}`)),
          CircuitBreaker.breaker(isHttpError),
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
          provideBreakerState,
          Effect.provideSomeLayer(dorixLayer),
          Effect.mapError(Management.managementError)
        ),

      getVenueMenu: pipe(
        Effect.service(IntegrationService),
        Effect.map((is) => is.vendorData.branchId),
        Effect.flatMap((branchId) => Http.request(`/v1/menu/branch/${branchId}`)),
        Effect.flatMap(Http.toJson),
        Effect.flatMap(decodeToEffect(DorixMenuDecoder)),
        Effect.map(toMenu),
        Effect.provideSomeLayer(dorixLayer),
        Effect.mapError(Management.managementError)
      ),
    }
  })
)
