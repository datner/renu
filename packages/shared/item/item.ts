import * as S from "@effect/schema/Schema";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Organization from '../organization'
import * as Category from '../category'
import * as Venue from '../venue'

export const Id = Common.Id('ItemId')
export type Id = S.To<typeof Id>

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
  venueId: Venue.Id,
  managementRepresentation: S.json
})

