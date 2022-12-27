import { ClearingIntegration, Order, Prisma } from "@prisma/client"
import * as RTE from "fp-ts/ReaderTaskEither"
import { GenericError } from "integrations/helpers"
import { CircuitBreakerEnv } from "integrations/http/circuitBreaker"
import { HttpCacheEnv, HttpClientEnv } from "integrations/http/httpClient"
import { HttpError } from "integrations/http/httpErrors"
import { ClearingError, ClearingValidationError } from "./clearingErrors"

export const fullOrderInclude = {
  items: {
    include: { item: true, modifiers: { include: { modifier: true } } },
  },
} satisfies Prisma.OrderInclude

export type FullOrderWithItems = Prisma.OrderGetPayload<{
  include: typeof fullOrderInclude
}>

type Env = HttpClientEnv & CircuitBreakerEnv & HttpCacheEnv & ClearingIntegrationEnv

type TxId = string

export interface ClearingProvider {
  getClearingPageLink(
    order: FullOrderWithItems
  ): RTE.ReaderTaskEither<Env, HttpError | ClearingError | GenericError, string>

  validateTransaction(
    order: Order
  ): RTE.ReaderTaskEither<
    Env,
    HttpError | ClearingError | ClearingValidationError | GenericError,
    TxId
  >
}

export interface ClearingIntegrationEnv {
  clearingIntegration: ClearingIntegration
}

export interface ClearingProviderEnv {
  clearingProvider: ClearingProvider
}
