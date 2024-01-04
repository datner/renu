import * as M from "@integrations/core/management";
import * as Dorix from "@integrations/dorix";
import { ManagementProvider, Order } from "database";
import { Effect, Layer } from "effect";
export { IntegrationSettingsService as Integration, ManagementService } from "@integrations/core/management";
export * from "@integrations/core/management-menu";

export const ManagementServiceLayer = Layer.effect(
  M.ManagementService,
  Effect.gen(function*($) {
    const services: Record<ManagementProvider, M.ManagementService> = {
      DORIX: yield* $(Dorix.Dorix),
      RENU: yield* $(Dorix.Dorix),
      PRESTO: yield* $(Dorix.Dorix),
    };

    return {
      reportOrder: (order) =>
        Effect.flatMap(M.IntegrationSettingsService, (_) => services[_.provider].reportOrder(order)),
      getOrderStatus: (order) =>
        Effect.flatMap(M.IntegrationSettingsService, (_) => services[_.provider].getOrderStatus(order)),
      getVenueMenu: Effect.flatMap(
        M.IntegrationSettingsService,
        (_) => services[_.provider].getVenueMenu,
      ),
    };
  }),
);

export const layer = Layer.provide(ManagementServiceLayer, Dorix.layer);

export const reportOrder = (order: M.FullOrderWithItems) =>
  Effect.flatMap(M.ManagementService, (_) => _.reportOrder(order));

export const getOrderStatus = (order: Order) => Effect.flatMap(M.ManagementService, (_) => _.getOrderStatus(order));

export const getVenueMenu = Effect.flatMap(M.ManagementService, (_) => _.getVenueMenu);
