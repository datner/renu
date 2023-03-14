import * as Layer from "@effect/io/Layer"
import * as Effect from "@effect/io/Effect"
import * as M from "@integrations/core/management"
import * as C from "@integrations/core/clearing"
import * as PayPlus from "@integrations/payplus"
import * as Gama from "@integrations/payplus"
import { ClearingProvider, Order } from "database"
export { IntegrationSettingsService, ClearingService } from "@integrations/core/clearing"

export const ClearingServiceLayer = Layer.effect(
  C.ClearingService,
  Effect.gen(function* ($) {
    const services: Record<ClearingProvider, C.ClearingService> = {
      PAY_PLUS: yield* $(Effect.service(PayPlus.Tag)),
      CREDIT_GUARD: yield* $(Effect.service(PayPlus.Tag)),
      GAMA: yield* $(Effect.service(Gama.Tag))
    }

    return {
      _tag: ClearingProvider.PAY_PLUS, // TODO: dissapear this from the interface
      getClearingPageLink: (order) =>
        Effect.serviceWithEffect(C.IntegrationSettingsService, (_) =>
          services[_.provider].getClearingPageLink(order)
        ),
      validateTransaction: (order) =>
        Effect.serviceWithEffect(C.IntegrationSettingsService, (_) =>
          services[_.provider].validateTransaction(order)
        ),
    }
  })
)

export const layer = Layer.provide(PayPlus.layer, ClearingServiceLayer)

export const getClearingPageLink = (order: M.FullOrderWithItems) =>
  Effect.serviceWithEffect(C.ClearingService, (_) => _.getClearingPageLink(order))

export const validateTransaction = (order: Order) =>
  Effect.serviceWithEffect(C.ClearingService, (_) => _.validateTransaction(order))
