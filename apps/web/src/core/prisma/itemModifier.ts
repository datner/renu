import { Prisma } from "database"
import { Common } from "shared/schema"
import * as _Menu from "src/menu/schema"

export const { belongsToVenue, id, idIn } = {
  belongsToVenue: (venue: Common.Slug) => ({
    item: { Venue: { identifier: venue } },
  }),
  id: (id: _Menu.ItemId) => ({
    id,
  }),
  idIn: (ids: _Menu.ItemId[]) => ({
    id: { in: ids },
  }),
} satisfies Record<string, (...args: any) => Prisma.ItemModifierWhereInput>
export const Where = { belongsToVenue, id, idIn }
