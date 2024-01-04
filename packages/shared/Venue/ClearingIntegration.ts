import * as ParseResult from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";
import { ClearingProvider } from "database";
import { Effect, identity, pipe } from "effect";
import { Database } from "../Database";
import { accessing } from "../effect/Context";
import { Common } from "../schema";
import { getClearing } from "./requests";
import * as Venue from "./venue";

export const Id = Common.Id("ClearingIntegrationId");
export type Id = Schema.Schema.To<typeof Id>;

const PayPlusData = Schema.struct({
  api_key: Schema.string,
  secret_key: Schema.string,
  service_charge: Schema.optional(Schema.number, { as: "Option" }),
  isQA: Schema.optional(Schema.boolean),
});

const NoData = Schema.struct({});

export const GamaData = Schema.struct({
  id: Schema.number,
  secret_key: Schema.string,
  env: Schema.literal("test", "demo", "production"),
});
export interface GamaData extends Schema.Schema.To<typeof GamaData> {}

export const VendorData = Schema.union(
  pipe(PayPlusData, Schema.attachPropertySignature("_tag", "PayPlusData")),
  pipe(GamaData, Schema.attachPropertySignature("_tag", "GamaData")),
  pipe(NoData, Schema.attachPropertySignature("_tag", "NoData")),
);
export type VendorData = Schema.Schema.To<typeof VendorData>;

const Provider = Schema.enums(ClearingProvider);

export const GeneralClearingIntegration = Schema.struct({
  id: Id,
  provider: Provider,
  terminal: Schema.string,
  venueId: Venue.Id,
  vendorData: Common.fromPrisma(VendorData),
});
export interface ClearingIntegration extends Schema.Schema.To<typeof GeneralClearingIntegration> {}

export const clearingOf = <I1, A1, T extends ClearingProvider>(s: Schema.Schema<I1, A1>, p: T) =>
  Schema.struct({
    id: Id,
    terminal: Schema.string,
    venueId: Venue.Id,
    provider: Schema.compose(Provider, Schema.literal(p)),
    vendorData: Common.fromPrisma(s),
  });

export const PayPlusIntegration = clearingOf(PayPlusData, "PAY_PLUS");
export interface PayPlusIntegration extends Schema.Schema.To<typeof PayPlusIntegration> {}
export const GamaIntegration = clearingOf(GamaData, "GAMA");
export interface GamaIntegration extends Schema.Schema.To<typeof GamaIntegration> {}
export const CreditGuardIntegration = clearingOf(NoData, "CREDIT_GUARD");
export interface CreditGuardIntegration extends Schema.Schema.To<typeof CreditGuardIntegration> {}

export const ClearingIntegration = Schema.compose(
  Schema.from(GeneralClearingIntegration),
  Schema.union(
    PayPlusIntegration,
    GamaIntegration,
    CreditGuardIntegration,
  ),
);

export const fromVenue = Schema.transformOrFail(
  Schema.from(Venue.Id),
  Schema.union(
    PayPlusIntegration,
    GamaIntegration,
    CreditGuardIntegration,
  ),
  id =>
    pipe(
      getClearing(id),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    ),
  _ => ParseResult.succeed(_.venueId),
);
