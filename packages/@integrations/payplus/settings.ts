import * as Effect from '@effect/io/Effect'
import { Clearing } from '@integrations/core'
import * as S from '@fp-ts/schema/Schema'
import * as Context from '@fp-ts/data/Context'
import * as P from '@fp-ts/schema/Parser'
import { ClearingProvider } from 'database'
import { pipe } from '@fp-ts/data/Function'
import * as Config from '@effect/io/Config'

export const PayPlusConfig = (isQA = false) =>
  Config.struct({
    url: Config.string(`PAY_PLUS_${isQA ? "QA_" : ""}API_URL`),
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
  S.extend(PayPlusIntegrations)
)
export type Integration = S.Infer<typeof Integration>
export const IntegrationService = Context.Tag<Integration>()

export const payplusIntegrationLayer = pipe(
  Effect.service(Clearing.IntegrationSettingsService),
  Effect.map(P.decode(Integration)),
  Effect.absolve,
  Effect.mapError(cause => new Clearing.ClearingError("failed to parse integration setting", { provider: "PAY_PLUS", cause })),
  Effect.toLayer(IntegrationService)
)

