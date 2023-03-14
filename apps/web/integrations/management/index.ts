import * as Effect from "@effect/io/Effect"
import { Order } from "database"
import * as RTE from "fp-ts/ReaderTaskEither"
import { FullOrderWithItems } from "integrations/clearing/clearingProvider"
import { ManagementIntegrationEnv } from "./managementClient"
import * as Management from "@integrations/management"
import { pipe } from "@effect/data/Function"
import * as Renu from "src/core/effect/runtime"

export const reportOrder = (order: FullOrderWithItems) =>
  pipe(
    RTE.asks((env: ManagementIntegrationEnv) => env.managementIntegration),
    RTE.chainTaskEitherKW(
      (integration) => () =>
        Renu.runPromiseEither$(
          pipe(
            Management.reportOrder(order),
            Effect.provideService(Management.Integration, integration)
          )
        )
    )
  )

export const getOrderStatus = (order: Order) =>
  pipe(
    RTE.asks((env: ManagementIntegrationEnv) => env.managementIntegration),
    RTE.chainTaskEitherKW(
      (integration) => () =>
        Renu.runPromiseEither$(
          pipe(
            Management.getOrderStatus(order),
            Effect.provideService(Management.Integration, integration)
          )
        )
    )
  )

export const getVenueMenu = pipe(
  RTE.asks((env: ManagementIntegrationEnv) => env.managementIntegration),
  RTE.chainTaskEitherKW(
    (integration) => () =>
      Renu.runPromiseEither$(
        pipe(Management.getVenueMenu, Effect.provideService(Management.Integration, integration))
      )
  )
)
