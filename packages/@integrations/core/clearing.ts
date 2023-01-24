import * as Effect from "@effect/io/Effect"
import * as Context from "@fp-ts/data/Context"
import * as S from "@fp-ts/schema/Schema"
import { ClearingIntegration, Order, Prisma, ClearingProvider } from "database"
import { Url } from "node:url"

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
  vendorData: S.json as S.Schema<Prisma.JsonValue>,
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

export type TxId = string

export interface ClearingService {
  getClearingPageLink: (
    order: FullOrderWithItems
  ) => Effect.Effect<ClearingIntegration, ClearingError, Url>

  validateTransaction: (
    order: Order
  ) => Effect.Effect<ClearingIntegration, ClearingError, TxId>

}
export const ClearingService = Context.Tag<ClearingService>()
