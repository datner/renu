import { Prisma } from "database"
import { Common } from "shared/schema"
import * as _Menu from "src/menu/schema"

export const { belongsToVenue, id, idIn } = {
  belongsToVenue: (venue: Common.Slug) => ({
    Venue: { identifier: venue },
  }),
  id: (id: _Menu.ItemId) => ({
    id,
  }),
  idIn: (ids: Iterable<_Menu.ItemId>) => ({
    id: { in: Array.from(ids) },
  }),
} satisfies Record<string, (...args: any) => Prisma.ItemWhereInput>
export const Where = { belongsToVenue, id, idIn }
