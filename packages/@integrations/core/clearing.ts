import * as S from "@effect/schema/Schema";
import { ClearingIntegration, ClearingProvider, Order, Prisma } from "database";
import { Brand, Context, Effect } from "effect";

export const fullOrderInclude = {
  items: {
    include: { item: true, modifiers: { include: { modifier: true } } },
  },
} satisfies Prisma.OrderInclude;

export type FullOrderWithItems = Prisma.OrderGetPayload<{
  include: typeof fullOrderInclude;
}>;

export const Integration: S.Schema<ClearingIntegration> = S.struct({
  id: S.number,
  provider: S.enums(ClearingProvider),
  terminal: S.string,
  venueId: S.number,
  vendorData: S.unknown as S.Schema<Prisma.JsonValue>,
});

export interface ClearingErrorOptions extends ErrorOptions {
  readonly provider?: ClearingProvider;
}

export class ClearingError extends Error {
  readonly _tag = "ClearingError";
  readonly provider?: ClearingProvider;
  constructor(public message: string, public options: ClearingErrorOptions) {
    super(message, options);
    this.provider = options.provider;
  }
}
export interface ClearingSettings {
  readonly _: unique symbol;
}
export const IntegrationSettingsService = Context.Tag<ClearingSettings, ClearingIntegration>();
export const Settings = IntegrationSettingsService;

export type TxId = string & Brand.Brand<"TxId">;
export const TxId = Brand.nominal<TxId>();

export interface ClearingService<Tag extends ClearingProvider = ClearingProvider> {
  readonly _tag: Tag;

  readonly getClearingPageLink: (
    order: FullOrderWithItems,
  ) => Effect.Effect<ClearingIntegration, ClearingError, URL>;

  readonly validateTransaction: (order: Order) => Effect.Effect<ClearingIntegration, ClearingError, TxId>;
}
export const ClearingService = Context.Tag<ClearingService>();
