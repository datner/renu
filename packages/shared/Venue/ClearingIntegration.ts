import * as ParseResult from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";
import { ClearingProvider } from "database";
import { Cause, Console, Effect, Option, pipe } from "effect";
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
}).pipe(Schema.attachPropertySignature("_tag", "PayPlusData"));

const NoData = Schema.attachPropertySignature(Schema.struct({}), "_tag", "NoData");

export const GamaData = Schema.struct({
  id: Schema.number,
  secret_key: Schema.string,
  env: Schema.literal("test", "demo", "production"),
}).pipe(Schema.attachPropertySignature("_tag", "GamaData"));
export interface GamaData extends Schema.Schema.To<typeof GamaData> {}

export const VendorData = Schema.union(
  PayPlusData,
  GamaData,
  NoData,
);
export type VendorData = Schema.Schema.To<typeof VendorData>;

const Provider = Schema.enums(ClearingProvider);

export const GeneralClearingIntegration = Schema.struct({
  id: Id,
  provider: Provider,
  terminal: Schema.string,
  venueId: Venue.Id,
  vendorData: Schema.compose(Schema.unknown, VendorData),
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
  Venue.Id,
  Schema.optionFromSelf(ClearingIntegration),
  id =>
    getClearing(id).pipe(
      Effect.tapErrorCause(_ => Console.error(Cause.pretty(_))),
      Effect.map(_ => _),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    ),
  _ =>
    _._tag === "Some"
      ? ParseResult.succeed(Venue.Id(_.value.venueId))
      : ParseResult.fail(ParseResult.parseError([ParseResult.forbidden])),
);
