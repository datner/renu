import * as Layer from "@effect/io/Layer"
import * as Effect from "@effect/io/Effect"
import * as M from "@integrations/core/management"
import * as Dorix from "@integrations/dorix"
import { Order } from "database"
export {
  IntegrationSettingsService as Integration,
  ManagementService,
} from "@integrations/core/management"

export const ManagementServiceLayer = Layer.effect(
  M.ManagementService,
  Effect.gen(function* ($) {
    const services: Record<"DORIX" | "RENU", M.ManagementService> = {
      DORIX: yield* $(Effect.service(Dorix.Tag)),
      RENU: yield* $(Effect.service(Dorix.Tag)),
    }

    return {
      reportOrder: (order) =>
        Effect.serviceWithEffect(M.IntegrationSettingsService, (_) =>
          services[_.provider].reportOrder(order)
        ),
      getOrderStatus: (order) =>
        Effect.serviceWithEffect(M.IntegrationSettingsService, (_) =>
          services[_.provider].getOrderStatus(order)
        ),
      getVenueMenu: Effect.serviceWithEffect(
        M.IntegrationSettingsService,
        (_) => services[_.provider].getVenueMenu
      ),
    }
  })
)

export const layer = Layer.provide(Dorix.layer, ManagementServiceLayer)

export const reportOrder = (order: M.FullOrderWithItems) =>
  Effect.serviceWithEffect(M.ManagementService, (_) => _.reportOrder(order))

export const getOrderStatus = (order: Order) =>
  Effect.serviceWithEffect(M.ManagementService, (_) => _.getOrderStatus(order))

export const getVenueMenu = Effect.serviceWithEffect(M.ManagementService, (_) => _.getVenueMenu)
