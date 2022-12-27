import { ManagementProvider, Order, OrderState } from "@prisma/client"
import * as RTE from "fp-ts/ReaderTaskEither"
import { FullOrderWithItems } from "integrations/clearing/clearingProvider"
import { dorixClient } from "integrations/dorix/dorixClient"
import { ManagementClient, ManagementClientEnv } from "./managementClient"

const renuClient: ManagementClient = {
  getVenueMenu: RTE.of("" as unknown) as unknown as ManagementClient["getVenueMenu"],
  getOrderStatus: RTE.of(OrderState.Unconfirmed) as unknown as ManagementClient["getOrderStatus"],
  reportOrder: RTE.of(undefined) as unknown as ManagementClient["reportOrder"],
}

export const clients = {
  [ManagementProvider.DORIX]: dorixClient,
  [ManagementProvider.RENU]: renuClient,
} as const

export const reportOrder = (order: FullOrderWithItems) =>
  RTE.asksReaderTaskEitherW((env: ManagementClientEnv) => env.managementClient.reportOrder(order))

export const getOrderStatus = (order: Order) =>
  RTE.asksReaderTaskEitherW((env: ManagementClientEnv) =>
    env.managementClient.getOrderStatus(order)
  )

export const getVenueMenu = () =>
  RTE.asksReaderTaskEitherW((env: ManagementClientEnv) => env.managementClient.getVenueMenu())
