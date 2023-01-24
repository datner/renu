import * as ZL from "@effect/io/Layer"
import * as Z from "@effect/io/Effect"
import { pipe } from "@fp-ts/data/Function"
import * as M from "@integrations/core/management"
import * as Dorix from "@integrations/dorix"
import { Order } from "database"
import * as RuntimeUtils from "shared/effect/Runtime"
export { ManagementService, IntegrationSettingsService } from "@integrations/core/management"

const withSettings = Z.serviceWithEffect(M.IntegrationSettingsService)

export const ManagementServiceLayer = ZL.effect(M.ManagementService)(
  Z.gen(function* ($) {
    const services: Record<"DORIX" | "RENU", M.ManagementService> = {
      DORIX: yield* $(Z.service(Dorix.DorixService)),
      RENU: yield* $(Z.service(Dorix.DorixService)),
    }

    return {
      reportOrder: (order) => withSettings((_) => services[_.provider].reportOrder(order)),
      getOrderStatus: (order) => withSettings((_) => services[_.provider].getOrderStatus(order)),
      getVenueMenu: withSettings((_) => services[_.provider].getVenueMenu),
    }
  })
)

const ManagementProvidersLayer = pipe(Dorix.DorixServiceLayer)

export const reportOrder = (order: M.FullOrderWithItems) =>
  Z.serviceWithEffect(M.ManagementService)((_) => _.reportOrder(order))

export const getOrderStatus = (order: Order) =>
  Z.serviceWithEffect(M.ManagementService)((_) => _.getOrderStatus(order))

export const getVenueMenu = Z.serviceWithEffect(M.ManagementService)((_) => _.getVenueMenu)

export const managementCleanup = Symbol.for("@integrations/management/runtime/cleanup")
export const ManagementRuntime = RuntimeUtils.makeRuntime(ManagementProvidersLayer)
export const getManagementRuntime = () =>
  RuntimeUtils.getAmbientRuntime(managementCleanup)(ManagementRuntime)
