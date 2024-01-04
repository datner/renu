import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";
import * as Models from "database";
import { Effect } from "effect";
import * as Organization from "../organization";
import { Common } from "../schema";
import * as internal from "./internal/service";

export const Id = Common.Id("VenueId");
export type Id = Schema.Schema.To<typeof Id>;

export const Logo = pipe(Schema.string, Schema.brand("Logo"));
export type Logo = Schema.Schema.To<typeof Logo>;

export const Open = pipe(Schema.boolean, Schema.brand("VenueOpen"));
export type Open = Schema.Schema.To<typeof Open>;

export const Identifier = pipe(Schema.string, Schema.fromBrand(Common.Slug), Schema.brand("VenueIdentifier"));
export type Identifier = Schema.Schema.To<typeof Identifier>;

export class Venue extends Schema.Class<Venue>()({
  id: Id,
  cuid: Schema.nullable(Schema.string),
  identifier: Identifier,
  logo: Logo,
  open: Open,
  simpleContactInfo: Schema.optionFromNullable(Schema.string),
  organizationId: Organization.Id,
  clearingProvider: Schema.enums(Models.ClearingProvider),
  updatedAt: Schema.DateFromSelf,
  createdAt: Schema.DateFromSelf,
  deleted: Schema.optionFromNullable(Schema.DateFromSelf),
}) {
  get orders() {
    return Effect.flatMap(internal.tag, _ => _.getOrdersById(this.id));
  }
}
