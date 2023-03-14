import * as Effect from "@effect/io/Effect"
import * as Config from "@effect/io/Config"
import * as Context from "@effect/data/Context"
import * as S from "@effect/schema/Schema"
import * as P from "@effect/schema/Parser"
import { pipe } from "@effect/data/Function"
import { Clearing } from "@integrations/core"
import { ClearingProvider } from "database"

export const GamaConfig = Config.all({
  test: Config.all({
    url: Config.string(`gamaTestApiUrl`),
  }),
  demo: Config.all({
    url: Config.string(`gamaDemoApiUrl`),
  }),
  url: Config.string(`gamaApiUrl`),
})

export const GamaClientId = pipe(S.string, S.brand('GamaClientId'))
export type GamaClientId = S.To<typeof GamaClientId>

export const GamaClientSecret = pipe(S.string, S.brand('GamaClientSecret'))
export type GamaClientSecret = S.To<typeof GamaClientSecret>

export const GamaEnv = {
  test: 'test',
  demo: 'demo',
  prod: 'production'
} as const

export const VendorData = S.struct({
    id: GamaClientId,
    secret_key: GamaClientSecret,
    env: S.enums(GamaEnv)
  })
export interface VendorData extends S.To<typeof VendorData> {}

export const GamaIntegrations = S.struct({
  provider: S.literal(ClearingProvider.GAMA),
  vendorData: VendorData,
})

export const Integration = pipe(
  Clearing.Integration,
  S.omit("vendorData"),
  S.omit("provider"),
  S.extend(GamaIntegrations)
)
export interface Integration extends S.To<typeof Integration> {}
export const IntegrationService = Context.Tag<Integration>()
export type IntegrationService = typeof IntegrationService

export const gamaIntegrationLayer = pipe(
  Effect.serviceWith(Clearing.IntegrationSettingsService, P.parse(Integration)),
  Effect.mapError(
    (cause) =>
      new Clearing.ClearingError("failed to parse integration setting", {
        provider: "GAMA",
        cause,
      })
  ),
  Effect.toLayer(IntegrationService)
)

