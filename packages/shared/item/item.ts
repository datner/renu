import { pipe } from "@effect/data/Function";
import * as S from "@effect/schema/Schema";
import { Prisma } from "database";
import * as Category from "../category";
import * as Organization from "../organization";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Venue from "../venue";

export const Id = Common.Id("ItemId");
export type Id = S.To<typeof Id>;

export const Schema = S.struct({
  id: Id,
  price: Number.Price,
  identifier: Common.Slug,
  image: S.string,
  organizationId: Organization.Id,
  createdAt: S.date,
  updatedAt: S.date,
  blurDataUrl: S.optionFromNullable(S.string),
  blurHash: S.optionFromNullable(S.string),
  deleted: S.optionFromNullable(S.date),
  categoryId: Category.Id,
  restaurantId: S.unknown,
  venueId: S.optionFromNullable(Venue.Id),
  managementRepresentation: Common.PrismaJson,
});
export interface Decoded extends S.To<typeof Schema> {}

export const fromProvider =
  <A extends S.Schema<Prisma.JsonValue, any>>(managementRepresentation: A) => (schema: typeof Schema) =>
    pipe(
      schema,
      S.omit("managementRepresentation"),
      S.extend(S.struct({ managementRepresentation })),
    );
