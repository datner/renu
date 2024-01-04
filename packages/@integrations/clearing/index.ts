import * as C from "@integrations/core/clearing";
import * as M from "@integrations/core/management";
import { Order } from "database";
import * as Effect from "effect/Effect";
export { ClearingService, IntegrationSettingsService, Settings } from "@integrations/core/clearing";

export const getClearingPageLink = (order: M.FullOrderWithItems) =>
  Effect.flatMap(C.ClearingService, (_) => _.getClearingPageLink(order));

export const validateTransaction = (order: Order) =>
  Effect.flatMap(C.ClearingService, (_) => _.validateTransaction(order));
