import * as Eq from "fp-ts/Eq"
import * as N from "fp-ts/number"
import * as S from "fp-ts/string"
import * as D from "fp-ts/Date"
import { Item, Prisma } from "@prisma/client"

const eqDateOrNull: Eq.Eq<Date | null> = {
  equals: (a, b) => (a !== null && b !== null && D.Eq.equals(a, b)) || a === b,
}

const eqManagement: Eq.Eq<Prisma.JsonValue> = {
  equals: (a, b) => S.Eq.equals(JSON.stringify(a), JSON.stringify(b)),
}

export const eqItem = Eq.struct<Item>({
  id: N.Eq,
  identifier: S.Eq,
  image: S.Eq,
  organizationId: N.Eq,
  restaurantId: Eq.eqStrict,
  categoryId: N.Eq,
  venueId: Eq.eqStrict,
  price: N.Eq,
  updatedAt: D.Eq,
  createdAt: D.Eq,
  deleted: eqDateOrNull,
  blurDataUrl: Eq.eqStrict,
  managementRepresentation: eqManagement,
})
