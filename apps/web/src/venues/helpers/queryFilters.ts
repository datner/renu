import { Prisma } from "database";
import { QueryFilter } from "src/core/helpers/prisma";

export const { isVenue, belongsToOrg } = {
  belongsToOrg: (id: number) => ({
    organization: { id },
  }),
  isVenue: (id: number) => ({
    id,
  }),
} satisfies Record<string, QueryFilter<Prisma.VenueWhereInput>>;
