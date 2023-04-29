import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as C from "@integrations/core/clearing";
import * as M from "@integrations/core/management";
import * as PayPlus from "@integrations/payplus";
import * as Gama from "@integrations/payplus";
import { ClearingProvider, Order } from "database";
export { ClearingService, IntegrationSettingsService } from "@integrations/core/clearing";

export const ClearingServiceLayer = Layer.effect(
  C.ClearingService,
  Effect.gen(function*($) {
    const services: Record<ClearingProvider, C.ClearingService> = {
      PAY_PLUS: yield* $(PayPlus.Tag),
      CREDIT_GUARD: yield* $(PayPlus.Tag),
      GAMA: yield* $(Gama.Tag),
    };

    return {
      _tag: ClearingProvider.PAY_PLUS, // TODO: dissapear this from the interface
      getClearingPageLink: (order) =>
        Effect.flatMap(C.IntegrationSettingsService, (_) => services[_.provider].getClearingPageLink(order)),
      validateTransaction: (order) =>
        Effect.flatMap(C.IntegrationSettingsService, (_) => services[_.provider].validateTransaction(order)),
    };
  }),
);

export const layer = Layer.provide(PayPlus.layer, ClearingServiceLayer);

export const getClearingPageLink = (order: M.FullOrderWithItems) =>
  Effect.flatMap(C.ClearingService, (_) => _.getClearingPageLink(order));

export const validateTransaction = (order: Order) =>
  Effect.flatMap(C.ClearingService, (_) => _.validateTransaction(order));

