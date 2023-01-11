import * as Z from "@effect/io/Effect"
import { Order } from "database"
import * as RTE from "fp-ts/ReaderTaskEither"
import { FullOrderWithItems } from "integrations/clearing/clearingProvider"
import { ManagementIntegrationEnv } from "./managementClient"
import * as Management from "@integrations/management"
import { pipe } from "fp-ts/lib/function"

const runtime = Management.getManagementRuntime()

export const reportOrder = (order: FullOrderWithItems) =>
  pipe(
    RTE.asks((env: ManagementIntegrationEnv) => env.managementIntegration),
    RTE.chainTaskEitherKW((integration) => async () => {
      const _ = await runtime
      return _.runtime.unsafeRunPromiseEither(
        pipe(
          Management.reportOrder(order),
          Z.provideService(Management.IntegrationSettingsService)(integration),
          Z.provideLayer(Management.ManagementServiceLayer)
        )
      )
    })
  )

export const getOrderStatus = (order: Order) =>
  pipe(
    RTE.asks((env: ManagementIntegrationEnv) => env.managementIntegration),
    RTE.chainTaskEitherKW(
      (integration) => () =>
        runtime.then((_) =>
          _.runtime.unsafeRunPromiseEither(
            pipe(
              Management.getOrderStatus(order),
              Z.provideService(Management.IntegrationSettingsService)(integration),
              Z.provideLayer(Management.ManagementServiceLayer)
            )
          )
        )
    )
  )

export const getVenueMenu = pipe(
  RTE.asks((env: ManagementIntegrationEnv) => env.managementIntegration),
  RTE.chainTaskEitherKW(
    (integration) => () =>
      runtime.then((_) =>
        _.runtime.unsafeRunPromiseEither(
          pipe(
            Management.getVenueMenu,
            Z.provideService(Management.IntegrationSettingsService)(integration),
            Z.provideLayer(Management.ManagementServiceLayer)
          )
        )
      )
  )
)
