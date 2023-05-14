import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";
import * as Models from "database";
import * as Organization from "../organization";
import { Common } from "../schema";

export const Id = Common.Id("VenueId");
export type Id = Schema.To<typeof Id>;

export const Logo = pipe(Schema.string, Schema.brand("Logo"));
export type Logo = Schema.To<typeof Logo>;

export const Open = pipe(Schema.boolean, Schema.brand("VenueOpen"));
export type Open = Schema.To<typeof Open>;

export const Identifier = pipe(Schema.string, Schema.fromBrand(Common.Slug), Schema.brand("VenueIdentifier"));
export type Identifier = Schema.To<typeof Identifier>;

export const Venue = Schema.struct({
  id: Id,
  identifier: Identifier,
  logo: Logo,
  open: Open,
  simpleContactInfo: Schema.optionFromNullable(Schema.string),
  organizationId: Organization.Id,
  clearingProvider: Schema.enums(Models.ClearingProvider),
  updatedAt: Schema.DateFromSelf,
  createdAt: Schema.DateFromSelf,
  deleted: Schema.optionFromNullable(Schema.DateFromSelf),
});
export interface Venue extends Schema.To<typeof Venue> {}
