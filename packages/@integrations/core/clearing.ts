import * as Effect from "@effect/io/Effect"
import * as Context from "@effect/data/Context"
import * as Brand from "@effect/data/Brand"
import * as S from "@effect/schema/Schema"
import * as J from "@effect/schema/data/Json"
import { ClearingIntegration, Order, Prisma, ClearingProvider } from "database"

export const fullOrderInclude = {
  items: {
    include: { item: true, modifiers: { include: { modifier: true } } },
  },
} satisfies Prisma.OrderInclude

export type FullOrderWithItems = Prisma.OrderGetPayload<{
  include: typeof fullOrderInclude
}>

export const Integration: S.Schema<ClearingIntegration> = S.struct({
  id: S.number,
  provider: S.enums(ClearingProvider),
  terminal: S.string,
  venueId: S.number,
  vendorData: J.json as S.Schema<Prisma.JsonValue>,
})

export interface ClearingErrorOptions extends ErrorOptions {
  readonly provider?: ClearingProvider
}

export class ClearingError extends Error {
  readonly _tag = "ClearingError"
  readonly provider?: ClearingProvider
  constructor(public message: string, public options: ClearingErrorOptions) {
    super(message, options)
    this.provider = options.provider
  }
}

export const IntegrationSettingsService = Context.Tag<ClearingIntegration>()
export const Settings = IntegrationSettingsService

export type TxId = string & Brand.Brand<"TxId">
export const TxId = Brand.nominal<TxId>()

export interface ClearingService {
  getClearingPageLink: (
    order: FullOrderWithItems
  ) => Effect.Effect<ClearingIntegration, ClearingError, URL>

  validateTransaction: (order: Order) => Effect.Effect<ClearingIntegration, ClearingError, TxId>
}
export const ClearingService = Context.Tag<ClearingService>()
