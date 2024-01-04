import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";
import * as Organization from "../organization";
import * as Common from "../schema/common";
import * as Venue from "../Venue/venue";

export const Id = Common.Id("CategoryId");
export type Id = Schema.Schema.To<typeof Id>;

export const Identifier = pipe(Schema.string, Schema.fromBrand(Common.Slug), Schema.brand("CategoryIdentifier"));

export class Category extends Schema.Class<Category>()({
  id: Id,
  menuId: Schema.optionFromNullable(Schema.number),
  // restaurantId: Schema.optionFromNullable(Schema.number)
  identifier: Identifier,
  organizationId: Organization.Id,
  venueId: Schema.optionFromNullable(Venue.Id),
  updatedAt: Schema.DateFromSelf,
  createdAt: Schema.DateFromSelf,
  deleted: Schema.optionFromNullable(Schema.DateFromSelf),
}) {}
