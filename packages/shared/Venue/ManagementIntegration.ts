import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";
import { ManagementProvider } from "database";
import { Common } from "../schema";
import * as Venue from "./venue";

export const Id = Common.Id("ManagementIntegrationId");
export type Id = Schema.To<typeof Id>;

const VendorMap = {
  Dorix: Schema.struct({
    branchId: Schema.string,
    isQA: Schema.optional(Schema.boolean),
  }),
  Presto: Schema.struct({
    id: Schema.string,
  }),
  NoData: Schema.object,
};

export const VendorData = Schema.union(
  pipe(VendorMap.Dorix, Schema.attachPropertySignature("_tag", "Dorix")),
  pipe(VendorMap.Presto, Schema.attachPropertySignature("_tag", "Presto")),
  pipe(VendorMap.NoData, Schema.attachPropertySignature("_tag", "NoData")),
);
export type VendorData = Schema.To<typeof VendorData>;

export const ManagementIntegration = Schema.struct({
  id: Id,
  provider: Schema.enums(ManagementProvider),
  venueId: Venue.Id,
  vendorData: Common.fromPrisma(VendorData),
});
export interface ManagementIntegration extends Schema.To<typeof ManagementIntegration> { }
