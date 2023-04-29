import { pipe } from "@effect/data/Function";
import * as S from "@effect/schema/Schema";
import * as Category from "../Category/category";
import * as Organization from "../organization";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Venue from "../Venue/venue";
import { ManagementRepresentationSchema } from "./ManagementRepresentation";

export const Id = Common.Id("ItemId");
export type Id = S.To<typeof Id>;

export const Item = S.struct({
  id: Id,
  price: Number.Price,
  identifier: Common.Slug,
  image: S.string,
  organizationId: Organization.Id,
  createdAt: S.DateFromSelf,
  updatedAt: S.DateFromSelf,
  blurDataUrl: S.optionFromNullable(S.string),
  blurHash: S.optionFromNullable(S.string),
  deleted: S.optionFromNullable(S.DateFromSelf),
  categoryId: Category.Id,
  restaurantId: S.unknown,
  venueId: S.optionFromNullable(Venue.Id),
  managementRepresentation: Common.fromPrisma(ManagementRepresentationSchema),
});
export interface Decoded extends S.To<typeof Item> { }

export const fromProvider =
  <A extends S.Schema<any, any>>(managementRepresentation: A) => (schema: typeof Item) =>
    pipe(
      schema,
      S.omit("managementRepresentation"),
      S.extend(S.struct({ managementRepresentation: Common.fromPrisma(managementRepresentation) })),
    );
