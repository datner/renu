import * as S from "@effect/schema/Schema";
import { ManagementIntegration, ManagementProvider, Order, OrderState, Prisma } from "database";
import { Context, Effect } from "effect";

export const fullOrderInclude = {
  items: {
    include: { item: true, modifiers: { include: { modifier: true } } },
  },
} satisfies Prisma.OrderInclude;

export type FullOrderWithItems = Prisma.OrderGetPayload<{
  include: typeof fullOrderInclude;
}>;

export const Integration = S.struct({
  id: S.number,
  venueId: S.number,
  provider: S.enums(ManagementProvider),
  vendorData: S.unknown,
});

export class ManagementError extends Error {
  readonly _tag = "ManagementError";
}

export const FullOrderService = Context.Tag<FullOrderWithItems>();
export const IntegrationSettingsService = Context.Tag<ManagementIntegration>();

export interface ManagementService {
  reportOrder: (
    order: FullOrderWithItems,
  ) => Effect.Effect<ManagementIntegration, ManagementError, void>;

  getOrderStatus: (
    order: Order,
  ) => Effect.Effect<ManagementIntegration, ManagementError, OrderState>;

  getVenueMenu: Effect.Effect<
    ManagementIntegration,
    ManagementError,
    ManagementMenu
  >;
}
export const ManagementService = Context.Tag<ManagementService>();

export interface Identified {
  id?: string;
  name: string;
}

export interface ManagementModifierOption extends Identified {
  price?: number;
}

export interface ManagementModifier extends Identified {
  min?: number;
  max?: number;
  options: ManagementModifierOption[];
}

export interface ManagementItem extends Identified {
  description: string;
  price: number;
  modifiers: ManagementModifier[];
}

export interface ManagementCategory extends Identified {
  items: ManagementItem[];
}

export interface ManagementMenu extends Identified {
  categories: ManagementCategory[];
}
