import { identity, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as ParseResult from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";
import { ManagementProvider } from "database";
import { Database } from "../Database";
import { accessing } from "../effect/Context";
import { Common } from "../schema";
import { getManagement } from "./requests";
import * as Venue from "./venue";

export const Id = Common.Id("ManagementIntegrationId");
export type Id = Schema.To<typeof Id>;

const VendorMap = {
  Dorix: Schema.struct({
    branchId: Schema.string,
    isQA: Schema.optional(Schema.boolean),
  }),
  Presto: Schema.struct({
    host: Schema.string,
    port: Schema.number,
    user: Schema.string,
    password: Schema.string,
  }),
  NoData: Schema.object,
};

const Provider = Schema.enums(ManagementProvider)

export const managementOf = <I1, A1, T extends ManagementProvider>(s: Schema.Schema<I1, A1>, p: T) => {
  return Schema.struct({
    id: Id,
    venueId: Venue.Id,
    provider: pipe(Provider, Schema.filter((_): _ is T => _ === p)),
    vendorData: Common.fromPrisma(s),
  });
};

export const GeneralManagementIntegration = Schema.struct({
  id: Id,
  provider: Provider,
  venueId: Venue.Id,
  vendorData: Common.PrismaJson,
});
export interface ManagementIntegration extends Schema.To<typeof GeneralManagementIntegration> { }

export const DorixIntegration = managementOf(VendorMap.Dorix, "DORIX");
export interface DorixIntegration extends Schema.To<typeof DorixIntegration> { }
export const PrestoIntegration = managementOf(VendorMap.Presto, "PRESTO");
export interface PrestoIntegration extends Schema.To<typeof PrestoIntegration> { }

export const ManagementIntegration = Schema.transform(
  Schema.from(GeneralManagementIntegration),
  Schema.union(
    DorixIntegration,
    PrestoIntegration,
  ),
  identity,
  identity,
);

export const fromVenue = Schema.transformResult(
  Schema.from(Venue.Id),
  ManagementIntegration,
  id =>
    pipe(
      getManagement(id),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    ),
  _ => ParseResult.success(_.venueId),
);
