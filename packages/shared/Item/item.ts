import { identity, pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as S from "@effect/data/String";
import * as Schema from "@effect/schema/Schema";
import * as Category from "../Category/category";
import * as Organization from "../organization";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Venue from "../Venue/venue";
import { ManagementRepresentationSchema } from "./ManagementRepresentation";

export const Id = Common.Id("ItemId");
export type Id = Schema.To<typeof Id>;

export const stringOption = <I, A extends string>(
  value: Schema.Schema<I, A>,
) =>
  Schema.transform(
    Schema.nullable(value),
    Schema.to(Schema.option(value)),
    _ => O.filter(O.fromNullable(_), S.isNonEmpty),
    O.getOrNull,
  );

export const Item = Schema.struct({
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
  managementRepresentation: Common.fromPrisma(ManagementRepresentationSchema),
});
export interface Decoded extends Schema.To<typeof Item> {}

export const fromProvider = <A extends Schema.Schema<any, any>>(managementRepresentation: A) => (schema: typeof Item) =>
  pipe(
    schema,
    Schema.omit("managementRepresentation"),
    Schema.extend(Schema.struct({ managementRepresentation: Common.fromPrisma(managementRepresentation) })),
  );
