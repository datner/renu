import * as ZL from "@effect/io/Layer"
import * as Z from "@effect/io/Effect"
import { pipe } from "@fp-ts/data/Function"
import * as M from "@integrations/core/management"
import * as C from "@integrations/core/clearing"
import { ClearingProvider, Order } from "database"
export { ManagementService, IntegrationSettingsService } from "@integrations/core/management"

const withSettings = Z.serviceWithEffect(C.IntegrationSettingsService)

declare const PayPlusService: Z.Effect<never, never, C.ClearingService>
declare const CreditGuardService: Z.Effect<never, never, C.ClearingService>

export const ClearingServiceLayer = ZL.effect(C.ClearingService)(
  Z.gen(function*($) {
    const services: Record<ClearingProvider, C.ClearingService> = {
      PAY_PLUS: yield* $(PayPlusService),
      CREDIT_GUARD: yield* $(CreditGuardService),
    }

    return {
      getClearingPageLink: (order) => withSettings((_) => services[_.provider].getClearingPageLink(order)),
      validateTransaction: (order) => withSettings((_) => services[_.provider].validateTransaction(order)),
    }
  })
)

declare const ManagementProvidersLayer: ZL.Layer<never, never, void>

export const getClearingPageLink = (order: M.FullOrderWithItems) =>
  Z.serviceWithEffect(C.ClearingService)((_) => _.getClearingPageLink(order))

export const validateTransaction = (order: Order) =>
  Z.serviceWithEffect(C.ClearingService)((_) => _.validateTransaction(order))

