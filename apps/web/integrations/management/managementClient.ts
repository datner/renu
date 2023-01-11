import * as RTE from "fp-ts/ReaderTaskEither"
import { ManagementIntegration, Order, OrderState } from "database"
import { HttpCacheEnv, HttpClientEnv } from "integrations/http/httpClient"
import { ManagementError } from "./managementErrors"
import { GenericError } from "integrations/helpers"
import { ZodParseError } from "src/core/helpers/zod"
import { HttpError } from "integrations/http/httpErrors"
import { ManagementMenu } from "./types"
import { FullOrderWithItems } from "integrations/clearing/clearingProvider"
import { CircuitBreakerEnv } from "integrations/http/circuitBreaker"
import { Management } from "@integrations/core"

type Env = HttpClientEnv & HttpCacheEnv & CircuitBreakerEnv & ManagementIntegrationEnv

export interface ManagementClient {
  reportOrder(
    order: FullOrderWithItems
  ): RTE.ReaderTaskEither<Env, Management.ManagementError, void>
  getOrderStatus(order: Order): RTE.ReaderTaskEither<Env, Management.ManagementError, OrderState>
  getVenueMenu(): RTE.ReaderTaskEither<
    Env,
    HttpError | ZodParseError | ManagementError | GenericError,
    ManagementMenu
  >
}

export interface ManagementIntegrationEnv {
  managementIntegration: ManagementIntegration
}

export interface ManagementClientEnv {}
