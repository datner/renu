import * as RTE from "fp-ts/ReaderTaskEither"
import {
  ManagementIntegration,
  Order,
  OrderItem,
  OrderItemModifier,
  OrderState,
} from "@prisma/client"
import { HttpCacheEnv, HttpClientEnv } from "integrations/http/httpClient"
import { ManagementError, ReportOrderFailedError } from "./managementErrors"
import { GenericError } from "integrations/helpers"
import { ZodParseError } from "src/core/helpers/zod"
import { HttpError } from "integrations/http/httpErrors"
import { ManagementMenu } from "./types"
import { FullOrderWithItems } from "integrations/clearing/clearingProvider"
import { CircuitBreakerEnv } from "integrations/http/circuitBreaker"

export type FullOrder = Order & { items: (OrderItem & { modifiers: OrderItemModifier[] })[] }

type Env = HttpClientEnv & HttpCacheEnv & CircuitBreakerEnv & ManagementIntegrationEnv

export interface ManagementClient {
  reportOrder(
    order: FullOrderWithItems
  ): RTE.ReaderTaskEither<
    Env,
    HttpError | ZodParseError | ManagementError | ReportOrderFailedError | GenericError,
    void
  >
  getOrderStatus(
    order: Order
  ): RTE.ReaderTaskEither<
    Env,
    HttpError | ZodParseError | ManagementError | GenericError,
    OrderState
  >
  getVenueMenu(): RTE.ReaderTaskEither<
    Env,
    HttpError | ZodParseError | ManagementError | GenericError,
    ManagementMenu
  >
}

export interface ManagementIntegrationEnv {
  managementIntegration: ManagementIntegration
}

export interface ManagementClientEnv {
  managementClient: ManagementClient
}
