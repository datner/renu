import { Prisma } from "database";
import * as _Menu from "src/menu/schema";

export const Where = {
  belongsToOrg: (orgId: number) => ({
    organization: { id: orgId },
  }),
  id: (id: number) => ({
    id,
  }),
  idIn: (ids: Iterable<number>) => ({
    id: { in: Array.from(ids) },
  }),
} satisfies Record<string, (...args: any) => Prisma.VenueWhereInput>;
