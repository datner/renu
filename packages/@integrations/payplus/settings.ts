import * as Effect from "@effect/io/Effect"
import * as Config from "@effect/io/Config"
import * as Context from "@effect/data/Context"
import * as S from "@effect/schema/Schema"
import * as P from "@effect/schema/Parser"
import { pipe } from "@effect/data/Function"
import { Clearing } from "@integrations/core"
import { ClearingProvider } from "database"

export const PayPlusConfig = Config.all({
  qa: Config.all({
    url: Config.string(`payPlusQaApiUrl`),
  }),
  url: Config.string(`payPlusApiUrl`),
})

export const PayPlusIntegrations = S.struct({
  provider: S.literal(ClearingProvider.PAY_PLUS),
  vendorData: S.struct({
    api_key: S.string,
    secret_key: S.string,
    isQA: S.optional(S.boolean),
  }),
})

export const Integration = pipe(
  Clearing.Integration,
  S.omit("vendorData"),
  S.omit("provider"),
  S.extend(PayPlusIntegrations)
)
export interface Integration extends S.Infer<typeof Integration> {}
export const IntegrationService = Context.Tag<Integration>()

export const payplusIntegrationLayer = pipe(
  Effect.service(Clearing.IntegrationSettingsService),
  Effect.map(P.decode(Integration)),
  Effect.absolve,
  Effect.mapError(
    (cause) =>
      new Clearing.ClearingError("failed to parse integration setting", {
        provider: "PAY_PLUS",
        cause,
      })
  ),
  Effect.toLayer(IntegrationService)
)
