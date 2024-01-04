import * as Schema from "@effect/schema/Schema";
import { Option, pipe, String } from "effect";
import * as Category from "../Category/category";
import * as Organization from "../organization";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Venue from "../Venue/venue";
import { ManagementRepresentationSchema } from "./ManagementRepresentation";

export const Id = Common.Id("ItemId");
export type Id = Schema.Schema.To<typeof Id>;

export const stringOption = <I, A extends string>(
  value: Schema.Schema<I, A>,
) =>
  Schema.transform(
    Schema.optionFromNullish(value, null),
    Schema.to(Schema.option(value)),
    Option.filter(String.isNonEmpty),
    _ => _,
  );

export class Item extends Schema.Class<Item>()({
  id: Id,
  price: Number.Price,
  identifier: Common.Slug,
  image: Schema.string,
  organizationId: Organization.Id,
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
  blurDataUrl: stringOption(Schema.string),
  blurHash: stringOption(Schema.string),
  deleted: Schema.optionFromNullable(Schema.DateFromSelf),
  categoryId: Category.Id,
  restaurantId: Schema.unknown,
  venueId: Schema.optionFromNullable(Venue.Id),
  managementRepresentation: Schema.compose(Schema.unknown, ManagementRepresentationSchema),
}) {}
export interface Decoded extends Schema.Schema.To<typeof Item> {}

export const fromProvider = <A extends Schema.Schema<any, any>>(managementRepresentation: A) => (schema: typeof Item) =>
  pipe(
    schema,
    Schema.omit("managementRepresentation"),
    Schema.extend(Schema.struct({ managementRepresentation: Common.fromPrisma(managementRepresentation) })),
  );
