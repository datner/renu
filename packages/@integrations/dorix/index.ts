import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as Config from "@effect/io/Config"
import * as ConfigSecret from "@effect/io/Config/Secret"
import * as Context from "@effect/data/Context"
import * as Parser from "@effect/schema/Parser"
import { pipe } from "@effect/data/Function"
import { CircuitBreaker, Http, Management } from "@integrations/core"
import { ManagementProvider, OrderState } from "database"
import { DorixMenu, toMenu } from "./menu"
import { ManagementError } from "@integrations/core/management"
import { HttpService } from "@integrations/core/http"
import {
  Integration,
  IntegrationService,
  SendOrderResponse,
  StatusResponse,
  toOrder,
} from "./helpers"

const DorixConfig = Config.all({
  qa: Config.all({
    url: Config.string("dorixQaApiUrl"),
    apiKey: Config.secret("dorixQaApiKey"),
  }),
  url: Config.string(`dorixApiUrl`),
  apiKey: Config.secret(`dorixApiKey`),
})

const provideDorixIntegration = Effect.provideServiceEffect(
  IntegrationService,
  Effect.serviceWith(Management.IntegrationSettingsService, Parser.parse(Integration))
)

const provideHttpConfig = Effect.provideServiceEffect(
  Http.HttpConfigService,
  Effect.gen(function* ($) {
    const { vendorData } = yield* $(Effect.service(IntegrationService))
    const { isQA = false } = vendorData
    const config = yield* $(Effect.config(DorixConfig))
    const { url, apiKey } = isQA ? config.qa : config

    return {
      baseUrl: url,
      headers: { Authorization: `Bearer ${ConfigSecret.value(apiKey)}` },
    }
  })
)

interface DorixService extends Management.ManagementService {
  _tag: typeof ManagementProvider.DORIX
}
export const Tag = Context.Tag<DorixService>()

export const layer = Layer.effect(
  Tag,
  Effect.gen(function* ($) {
    const breaker = yield* $(CircuitBreaker.makeBreaker({ name: "Dorix" }))
    const client = yield* $(Effect.service(HttpService))

    return {
      _tag: ManagementProvider.DORIX,
      reportOrder: (order) =>
        pipe(
          toOrder(order),
          Effect.tap(() => Effect.log("reporting order to dorix")),
          Effect.map(JSON.stringify),
          Effect.flatMap((body) =>
            client.request("/v1/order", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body,
            })
          ),
          breaker((e) => e instanceof Http.HttpRequestError),
          Effect.flatMap(Http.toJson),
          Effect.map(Parser.parse(SendOrderResponse)),
          Effect.flatMap((res) =>
            res.ack ? Effect.succeed(res) : Effect.fail(new Error(res.message))
          ),
          provideHttpConfig,
          provideDorixIntegration,
          Effect.mapError((cause) => new ManagementError("failed to get order status", { cause })),
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
          Effect.flatMap((qs) => client.request(`/v1/order/${order.id}/status?${qs.toString()}`)),
          breaker((e) => e instanceof Http.HttpRequestError),
          Effect.flatMap(Http.toJson),
          Effect.map(Parser.parse(StatusResponse)),
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
          provideHttpConfig,
          provideDorixIntegration,
          Effect.mapError((cause) => new ManagementError("failed to get order status", { cause }))
        ),

      getVenueMenu: pipe(
        Effect.service(IntegrationService),
        Effect.map((is) => is.vendorData.branchId),
        Effect.flatMap((branchId) => client.request(`/v1/menu/branch/${branchId}`)),
        breaker((e) => e instanceof Http.HttpRequestError),
        Effect.flatMap(Http.toJson),
        Effect.map(Parser.parse(DorixMenu)),
        Effect.map(toMenu),
        provideHttpConfig,
        provideDorixIntegration,
        Effect.mapError((cause) => new ManagementError("failed to get order status", { cause }))
      ),
    }
  })
)
